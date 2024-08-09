import { error } from 'console';
import { json } from 'stream/consumers';
import axios from 'axios';
import cheerio from 'cheerio';

import chatgpt from './chatgpt';
import smms from './smms';

type CrawlerRequest = {
  url: string;
  categoryList: string;
};

type CrawlerResponse = {
  code: number;
  msg: string;
  data: CrawlerData | null;
};

type CrawlerData = {
  description: string;
  detail: string;
  content: string;
  category_name: string;
  name: string;
  screenshot_data: string;
  screenshot_thumbnail_data: string;
  tags: string[] | null;
  title: string;
  url: string;
};

export default async function crawler({ url, categoryList }: CrawlerRequest): Promise<CrawlerResponse> {
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
        msg: 'title and description is empty',
        data: null,
      };
    }

    // 4. Generate the prompt for ChatGPT
    const prompt = `Please generate a JSON object in English based on the following information. The JSON should include the following fields:

- "description": A concise description of the website.
- "detail": A detailed and expansive description or content of the website, inferred from the title and description. Be creative and elaborate on what the website offers.
- "content": A detailed and comprehensive description of the features, offerings, and functionalities of the website, based on the title and description provided. This field should provide an in-depth look at what users can expect from the website.
- "category_name": Automatically select the most appropriate category name from the provided category list, based on the content of the website. This field must not be left empty.
- "name": The name of the website, inferred from the title.
- "tags": Automatically generate relevant tags related to the content of the website, formatted as an array of strings. Do not leave this field empty.
- "title": The title of the website.

The webpage content is as follows:

title: ${title}
description: ${description}
category_list: ${categoryList}

Please provide only the JSON string in your response, strictly in English, without any additional text or explanations. Ensure that the "category_name" is selected and not left empty.

`;

    // 4. 使用 ChatGPT API 生成 CrawlerData
    const chatGPTResponse = await chatgpt(prompt, url);

    if (chatGPTResponse.error || !chatGPTResponse.result) {
      return {
        code: 500,
        msg: JSON.stringify(error),
        data: null,
      };
    }

    const smmsResp = await smms(url);

    var screenshot_data = '';
    if (smmsResp.success && smmsResp.data) {
      screenshot_data = smmsResp.data['url'] || '';
    }

    // 5. 构造 CrawlerData 对象
    const crawlerData: CrawlerData = {
      description: chatGPTResponse.result.description,
      detail: chatGPTResponse.result.detail,
      content: chatGPTResponse.result.content,
      category_name: chatGPTResponse.result.category_name,
      name: chatGPTResponse.result.name,
      screenshot_data: screenshot_data, // 这里需要你自己处理截图的部分
      screenshot_thumbnail_data: screenshot_data, // 这里需要你自己处理截图的部分
      tags: chatGPTResponse.result.tags,
      title: chatGPTResponse.result.title,
      url: url,
    };

    return {
      code: 200,
      msg: 'success',
      data: crawlerData,
    };
  } catch (error) {
    console.error('Error occurred during crawling:', error);
    return {
      code: 500,
      msg: JSON.stringify(error),
      data: null,
    };
  }
}
