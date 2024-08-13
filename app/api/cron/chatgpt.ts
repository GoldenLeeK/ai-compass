import axios from 'axios';

type Data = {
  error?: string;
  result?: CrawlerData;
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

const CHATGPT_API_KEY = process.env.CHATGPT_API_KEY; // 替换为你的 API 密钥
const CHATGPT_API_URL = process.env.CHATGPT_API_URL; //API url

export default async function chatgpt(prompt: string, url: string): Promise<Data> {
  if (!prompt) {
    return { error: 'Please provide a prompt' };
  }

  const body = {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
  };

  try {
    const response = await axios.post(`${CHATGPT_API_URL}/v1/chat/completions`, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CHATGPT_API_KEY}`,
      },
    });

    const content = response.data.choices[0]['message']['content'];

    // 假设 ChatGPT 返回的内容可以解析成 CrawlerData 格式
    const parsedData: Partial<CrawlerData> = JSON.parse(content);

    const crawlerData: CrawlerData = {
      description: parsedData.description || '',
      detail: parsedData.detail || '',
      content: parsedData.content || '',
      category_name: parsedData.category_name || '',
      name: parsedData.name || '',
      screenshot_data: '', // 你可以在这里处理截图数据
      screenshot_thumbnail_data: '', // 你可以在这里处理截图缩略图数据
      tags: parsedData.tags || null,
      title: parsedData.title || '',
      url: url,
    };

    return { result: crawlerData };
  } catch (error) {
    console.error(error);
    return { error: JSON.stringify(error) };
  }
}
