/* eslint-disable import/prefer-default-export */
import crawler from './crawler';

export async function POST() {
  const CrawlerRequest = { url: 'https://learnku.com' };

  const result = await crawler(CrawlerRequest);
  return Response.json({ result });
}
