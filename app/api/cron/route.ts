/* eslint-disable import/prefer-default-export */
import { createClient } from '@/db/supabase/client';

import crawler from './crawler';

export async function POST() {
  const supabase = createClient();
  // Check if name already exists
  const { data: websiteList, error: error } = await supabase.from('submit').select('id,url').eq('status', 0);

  //查不到记录
  if (error && error.code !== 'PGRST116') {
    return Response.json('success');
  }

  if (!websiteList || websiteList.length === 0) {
    return Response.json({ message: 'No websites to process.' });
  }

  const categoryList = 'Code-IT,Image';

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

      // 插入新数据
      const { error: insertError } = await supabase.from('web_navigation').insert({
        url: website.url,
        title: result.data.title,
        detail: result.data.detail,
        category_name: result.data.category_name,
        name: result.data.name,
        content: result.data.content,
        tag_name: result.data?.tags.join(', '),
        collection_time: new Date().toISOString(),
        image_url: result.data?.screenshot_data,
        thumbnail_url: result.data?.screenshot_data,
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
      // You can handle the error accordingly, such as logging or updating status
      // Update the status to mark the website as processed
    }
  }

  // Return the results
  return Response.json({ results });
}
