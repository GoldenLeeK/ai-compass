/* eslint-disable import/prefer-default-export */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/db/supabase/client';

import crawler from './crawler';

export async function POST(req: NextRequest) {
  // // Get Authorization
  const authHeader = req.headers.get('Authorization');

  // Check Authorization and Verify token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authorization header is missing or malformed' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const submitKey = process.env.CRON_AUTH_KEY;
  // check key
  const isValid = submitKey === token;
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const supabase = createClient();

  // Check if name already exists
  const { data: websiteList, error: websiteError } = await supabase.from('submit').select('id,url').eq('status', 0);

  //查不到记录
  if (websiteError && websiteError.code !== 'PGRST116') {
    return NextResponse.json('success');
  }

  if (!websiteList || websiteList.length === 0) {
    return NextResponse.json({ message: 'No websites to process.' });
  }

  const { data: categories, error: caegoryError } = await supabase.from('navigation_category').select('name');

  var categoryList = '';
  //查不到记录
  if (caegoryError && caegoryError.code !== 'PGRST116') {
    categoryList = 'Other';
  } else {
    categoryList = categories && categories.length > 0 ? categories.map((item) => item.name).join(', ') : 'Other';
  }

  // Array to hold the results
  const results = [];

  // Loop through each website in the list
  for (const website of websiteList) {
    try {
      if (!website.url) {
        continue;
      }
      // Prepare the crawler request with the current website's URL
      const CrawlerRequest = { url: website.url, categoryList };

      // Perform the crawling operation
      const result = await crawler(CrawlerRequest);
      console.log('Crawler result for:', website.url, result);
      if (result.code !== 200) {
        return NextResponse.json(result);
      }

      // 插入新数据
      const { error: insertError } = await supabase.from('web_navigation').insert({
        url: website.url,
        title: result?.data?.title || '',
        detail: result?.data?.detail || '',
        category_name: result?.data?.category_name || '',
        name: result?.data?.name || '',
        content: result?.data?.content || '',
        tag_name: result?.data?.tags?.join(', ') || '',
        collection_time: new Date().toISOString() || '',
        image_url: result.data?.screenshot_data || '',
        thumbnail_url: result.data?.screenshot_data || '',
        star_rating: 0,
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Update the status to mark the website as processed
      await supabase.from('submit').update({ status: 1 }).eq('id', website.id);

      // Add the result to the results array
      results.push({ id: website.id, ...result });
    } catch (err) {
      console.error(`Error processing ${website.url}:`, err);
      await supabase.from('submit').update({ status: 2 }).eq('id', website.id);
    }
  }

  // Return the results
  return NextResponse.json({ results });
}
