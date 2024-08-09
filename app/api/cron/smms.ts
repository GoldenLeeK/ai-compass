import { Readable } from 'stream'; // Import for readable stream support
import axios from 'axios';
import FormData from 'form-data';
import puppeteer from 'puppeteer';

const SMMS_API_URL = 'https://sm.ms/api/v2/upload'; // SM.MS API 上传端点
const SMMS_API_KEY = process.env.SMMS_API_KEY; // 替换为你的 SM.MS API 密钥

// Define the type for SMMS response
type smmsResp = {
  success: boolean;
  code: string;
  message: string;
  data?: Map<string, string>;
  RequestId?: string;
};

export default async function smms(url: string): Promise<smmsResp> {
  if (!url || typeof url !== 'string') {
    return <smmsResp>{ success: false, message: 'Invalid URL' };
  }
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Capture screenshot
    const screenshot = await page.screenshot({ type: 'webp' });

    await browser.close();

    const stream = Readable.from(screenshot);

    // Upload screenshot to SM.MS
    const form = new FormData();
    const timestamp = Date.now();
    form.append('smfile', stream, { filename: `${url}-${timestamp}.webp`, contentType: 'image/webp' });

    const response = await axios.post(SMMS_API_URL, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `${SMMS_API_KEY}`,
      },
    });

    // 如果有 data 字段并且是对象类型，转化为 Map
    if (response.data.data && typeof response.data.data === 'object') {
      response.data.data = new Map(Object.entries(response.data.data));
    }

    // 返回解析后的对象并断言为 smmsResp 类型
    return response.data as smmsResp;
  } catch (error) {
    console.error(error);
    return <smmsResp>{ success: false, code: 'error', message: error };
  }
}
