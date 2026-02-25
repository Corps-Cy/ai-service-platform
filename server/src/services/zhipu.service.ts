import axios from 'axios';

const ZHIPU_BASE_URL = process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY;

export interface ZhipuResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

export interface ImageGenOptions {
  prompt: string;
  size?: string;
  num?: number;
}

export interface TextGenOptions {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
}

export interface ImageUnderstandOptions {
  image: string;
  prompt: string;
}

class ZhipuService {
  private apiKey: string;

  constructor() {
    if (!ZHIPU_API_KEY) {
      throw new Error('ZHIPU_API_KEY not configured');
    }
    this.apiKey = ZHIPU_API_KEY;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  // 文生图 (CogView)
  async generateImage(options: ImageGenOptions): Promise<any> {
    try {
      const response = await axios.post(
        `${ZHIPU_BASE_URL}/images/generations`,
        {
          model: 'cogview-3',
          prompt: options.prompt,
          size: options.size || '1024x1024',
          n: options.num || 1
        },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Image generation error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || '图片生成失败');
    }
  }

  // 文本生成 (GLM-4)
  async generateText(options: TextGenOptions): Promise<any> {
    try {
      const response = await axios.post(
        `${ZHIPU_BASE_URL}/chat/completions`,
        {
          model: options.model || 'glm-4',
          messages: options.messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 2000
        },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Text generation error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || '文本生成失败');
    }
  }

  // 图片理解 (GLM-4V)
  async understandImage(options: ImageUnderstandOptions): Promise<any> {
    try {
      const response = await axios.post(
        `${ZHIPU_BASE_URL}/chat/completions`,
        {
          model: 'glm-4v',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: options.prompt },
                { type: 'image_url', image_url: { url: options.image } }
              ]
            }
          ]
        },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Image understanding error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || '图片理解失败');
    }
  }

  // 文档处理（PDF解析）
  async parseDocument(content: string, task: string): Promise<any> {
    try {
      const response = await axios.post(
        `${ZHIPU_BASE_URL}/chat/completions`,
        {
          model: 'glm-4',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的文档处理助手，擅长PDF解析、内容提取、格式转换等任务。'
            },
            {
              role: 'user',
              content: `请帮我完成以下任务：${task}\n\n文档内容：\n${content}`
            }
          ],
          temperature: 0.3,
          max_tokens: 4000
        },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Document parsing error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || '文档处理失败');
    }
  }

  // Excel操作（生成/分析）
  async processExcel(instruction: string, data?: any): Promise<any> {
    try {
      const content = data ? `现有数据：\n${JSON.stringify(data, null, 2)}\n` : '';
      const response = await axios.post(
        `${ZHIPU_BASE_URL}/chat/completions`,
        {
          model: 'glm-4',
          messages: [
            {
              role: 'system',
              content: '你是一个Excel专家，擅长数据生成、分析和格式化。请以JSON格式返回结果。'
            },
            {
              role: 'user',
              content: `${content}请帮我：${instruction}`
            }
          ],
          temperature: 0.5,
          max_tokens: 3000
        },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Excel processing error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Excel处理失败');
    }
  }

  // 视频生成（如果API支持）
  async generateVideo(prompt: string, duration: number = 5): Promise<any> {
    try {
      const response = await axios.post(
        `${ZHIPU_BASE_URL}/videos/generations`,
        {
          model: 'cogvideox',
          prompt: prompt,
          duration: duration
        },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Video generation error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || '视频生成失败，功能可能暂未开放');
    }
  }
}

export const zhipuService = new ZhipuService();
