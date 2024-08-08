import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

type Data = {
  error?: string;
  result?: string;
};

const proxy = {
  host: '127.0.0.1',
  port: 10809,
  protocol: 'http', // 代理协议，可能是 http 或 https
};

const CHATGPT_API_KEY = process.env.CHATGPT_API_KEY; // 替换为你的  API 密钥

export default async function chatgpt(prompt: string): Promise<Data> {
  if (!prompt) {
    return <Data>{ error: 'Please provide a prompt' };
  }

  const body = {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
  };

  try {
    const response = await axios.post('https://api.chatanywhere.tech/v1/chat/completions', body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CHATGPT_API_KEY}`,
      },
    });

    const result = response.data.choices[0]['message']['content'];
    return <Data>{ result: result };
  } catch (error) {
    console.error(error);
    return <Data>{ error: error };
  }
}
