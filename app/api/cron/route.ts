/* eslint-disable import/prefer-default-export */
import crawler from './crawler';

export async function POST() {
  const CrawlerRequest = { url: 'https://brev.ai/', categoryList: 'Code-IT,Image' };

  const result = await crawler(CrawlerRequest);

  // const resp = await smms('https://learnku.com');
  return Response.json({ result });
}
