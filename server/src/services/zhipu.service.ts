import apiClient from '../utils/apiClient.js';
import logger from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

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

  // 文生图 (CogView)
  async generateImage(options: ImageGenOptions): Promise<any> {
    logger.info('Image generation request', { prompt: options.prompt });
    
    try {
      const response = await apiClient.post(
        `${ZHIPU_BASE_URL}/images/generations`,
        {
          model: 'cogview-3',
          prompt: options.prompt,
          size: options.size || '1024x1024',
          n: options.num || 1
        }
      );
      
      logger.info('Image generation success', { 
        prompt: options.prompt,
        resultCount: response.data?.data?.length || 1 
      });
      
      return response.data;
    } catch (error: any) {
      logger.error('Image generation failed', {
        error: error.response?.data || error.message,
        prompt: options.prompt
      });
      
      if (error.response?.status === 429) {
        throw new AppError(429, '请求过于频繁，请稍后再试');
      }
      
      throw new AppError(500, error.response?.data?.message || '图片生成失败');
    }
  }

  // 文本生成 (GLM-4)
  async generateText(options: TextGenOptions): Promise<any> {
    logger.info('Text generation request', { model: options.model, messageCount: options.messages.length });
    
    try {
      const response = await apiClient.post(
        `${ZHIPU_BASE_URL}/chat/completions`,
        {
          model: options.model || 'glm-4',
          messages: options.messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 2000
        }
      );
      
      logger.info('Text generation success', { 
        model: options.model,
        tokensUsed: response.data?.usage?.total_tokens 
      });
      
      return response.data;
    } catch (error: any) {
      logger.error('Text generation failed', {
        error: error.response?.data || error.message,
        model: options.model
      });
      
      if (error.response?.status === 429) {
        throw new AppError(429, '请求过于频繁，请稍后再试');
      }
      
      throw new AppError(500, error.response?.data?.message || '文本生成失败');
    }
  }

  // 图片理解 (GLM-4V)
  async understandImage(options: ImageUnderstandOptions): Promise<any> {
    logger.info('Image understanding request');
    
    try {
      const response = await apiClient.post(
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
        }
      );
      
      logger.info('Image understanding success');
      
      return response.data;
    } catch (error: any) {
      logger.error('Image understanding failed', {
        error: error.response?.data || error.message
      });
      
      if (error.response?.status === 429) {
        throw new AppError(429, '请求过于频繁，请稍后再试');
      }
      
      throw new AppError(500, error.response?.data?.message || '图片理解失败');
    }
  }

  // 文档处理（PDF解析）
  async parseDocument(content: string, task: string): Promise<any> {
    logger.info('Document processing request', { task, contentLength: content.length });
    
    try {
      const response = await apiClient.post(
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
        }
      );
      
      logger.info('Document processing success');
      
      return response.data;
    } catch (error: any) {
      logger.error('Document processing failed', {
        error: error.response?.data || error.message,
        task
      });
      
      if (error.response?.status === 429) {
        throw new AppError(429, '请求过于频繁，请稍后再试');
      }
      
      throw new AppError(500, error.response?.data?.message || '文档处理失败');
    }
  }

  // Excel操作（生成/分析）
  async processExcel(instruction: string, data?: any): Promise<any> {
    logger.info('Excel processing request', { hasData: !!data, instruction });
    
    try {
      const content = data ? `现有数据：\n${JSON.stringify(data, null, 2)}\n` : '';
      const response = await apiClient.post(
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
        }
      );
      
      logger.info('Excel processing success');
      
      return response.data;
    } catch (error: any) {
      logger.error('Excel processing failed', {
        error: error.response?.data || error.message,
        instruction
      });
      
      if (error.response?.status === 429) {
        throw new AppError(429, '请求过于频繁，请稍后再试');
      }
      
      throw new AppError(500, error.response?.data?.message || 'Excel处理失败');
    }
  }

  // 视频生成（如果API支持）
  async generateVideo(prompt: string, duration: number = 5): Promise<any> {
    logger.info('Video generation request', { prompt, duration });
    
    try {
      const response = await apiClient.post(
        `${ZHIPU_BASE_URL}/videos/generations`,
        {
          model: 'cogvideox',
          prompt: prompt,
          duration: duration
        }
      );
      
      logger.info('Video generation success');
      
      return response.data;
    } catch (error: any) {
      logger.error('Video generation failed', {
        error: error.response?.data || error.message,
        prompt
      });
      
      // 视频生成可能暂未开放，返回友好提示
      throw new AppError(400, '视频生成功能暂未开放，请稍后再试');
    }
  }
}

export const zhipuService = new ZhipuService();
