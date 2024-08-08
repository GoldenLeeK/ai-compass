import axios from 'axios';
import cheerio from 'cheerio';

import chatgpt from './chatgpt';

type CrawlerRequest = {
  url: string;
};

type CrawlerResponse = {
  code: number;
  msg: string;
};

type CrawlerData = {
  description: string;
  detail: string;
  languages: string[];
  name: string;
  screenshot_data: string;
  screenshot_thumbnail_data: string;
  tags: string[] | null;
  title: string;
  url: string;
};

export default async function crawler({ url }: CrawlerRequest) {
  try {
    // 1. 获取页面内容
    const response = await axios.get(url);
    const html = response.data;

    // 2. 使用 cheerio 解析 HTML
    const $ = cheerio.load(html);

    // 3. 提取页面内容的文本（不包括图片）
    // 3. Extract the title
    const title = $('title').text();

    // 4. Extract the description from meta tag
    const description = $('meta[name="description"]').attr('content') || '';

    if (title == '' && description == '') {
      return {
        code: 500,
        msg: 'empty title description',
      };
    }

    // 4. Generate the prompt for ChatGPT
    const prompt = `Please generate a JSON object based on the following information. The JSON should include the following fields:

- "description": A brief description of the website.
- "detail": A detailed description or content of the website, inferred from the title and description.
- "languages": The programming languages or tech stack used, formatted as an array of strings. (If not applicable, leave it empty.)
- "name": The name of the website, inferred from the title.
- "tags": Tags related to the content of the website, formatted as an array of strings. (If not applicable, leave it empty.)
- "title": The title of the website.

The webpage content is as follows:

title is ${title}
description is ${description}

Please provide only the JSON string in your response, without any additional text or explanations.
`;

    // 4. 使用 ChatGPT API 生成 CrawlerData
    const chatGPTResponse = await chatgpt(prompt, url);

    if (chatGPTResponse.error || !chatGPTResponse.result) {
      return {
        code: 500,
        msg: 'chatgpt error',
      };
    }

    // 5. 构造 CrawlerData 对象
    const crawlerData: CrawlerData = {
      description: chatGPTResponse.result.description,
      detail: chatGPTResponse.result.detail,
      languages: chatGPTResponse.result.languages,
      name: chatGPTResponse.result.name,
      screenshot_data: '', // 这里需要你自己处理截图的部分
      screenshot_thumbnail_data: '', // 这里需要你自己处理截图的部分
      tags: chatGPTResponse.result.tags,
      title: chatGPTResponse.result.title,
      url: url,
    };

    return crawlerData;
  } catch (error) {
    console.error('Error occurred during crawling:', error);
    return {
      code: 500,
      msg: 'Internal Server Error',
    };
  }
}
