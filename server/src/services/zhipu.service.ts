import apiClient from '../utils/apiClient.js';
import logger from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

const ZHIPU_BASE_URL = process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';

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
    // 不再抛出错误，允许服务启动
    this.apiKey = process.env.ZHIPU_API_KEY || '';
    
    if (!this.apiKey) {
      logger.warn('ZHIPU_API_KEY not configured. AI features will not work until configured.');
    } else {
      logger.info('ZhipuAI service initialized successfully');
    }
  }

  // 检查是否已配置
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  // 重新加载配置
  reloadConfig(): void {
    this.apiKey = process.env.ZHIPU_API_KEY || '';
    if (this.apiKey) {
      logger.info('ZhipuAI configuration reloaded');
    }
  }

  // 检查配置并抛出友好的错误
  private checkConfig(): void {
    if (!this.apiKey) {
      throw new AppError(503, '智谱AI服务未配置，请先完成系统初始化配置');
    }
  }

  // 文生图 (CogView)
  async generateImage(options: ImageGenOptions): Promise<any> {
    this.checkConfig();
    
    logger.info('Image generation request', { prompt: options.prompt });
    
    try {
      const response = await apiClient.post(
        `${ZHIPU_BASE_URL}/images/generations`,
        {
          model: 'cogview-3',
          prompt: options.prompt,
          size: options.size || '1024x1024',
          n: options.num || 1,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('Image generated successfully', { prompt: options.prompt });
      return response.data;
    } catch (error: any) {
      logger.error('Image generation failed', { error: error.message, prompt: options.prompt });
      throw new AppError(500, error.message || '图片生成失败');
    }
  }

  // 文本生成
  async generateText(options: TextGenOptions): Promise<any> {
    this.checkConfig();
    
    logger.info('Text generation request', { model: options.model });

    try {
      const response = await apiClient.post(
        `${ZHIPU_BASE_URL}/chat/completions`,
        {
          model: options.model || 'glm-4',
          messages: options.messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 1024,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('Text generated successfully', { model: options.model });
      return response.data;
    } catch (error: any) {
      logger.error('Text generation failed', { error: error.message, model: options.model });
      throw new AppError(500, error.message || '文本生成失败');
    }
  }

  // 图片理解 (GLM-4V)
  async understandImage(options: ImageUnderstandOptions): Promise<any> {
    this.checkConfig();
    
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
                { type: 'image_url', image_url: { url: options.image } },
                { type: 'text', text: options.prompt },
              ],
            },
          ],
          max_tokens: 1024,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('Image understood successfully');
      return response.data;
    } catch (error: any) {
      logger.error('Image understanding failed', { error: error.message });
      throw new AppError(500, error.message || '图片理解失败');
    }
  }

  // 文档解析
  async parseDocument(content: string, task: string): Promise<string> {
    this.checkConfig();
    
    logger.info('Document parsing request', { task });

    try {
      const response = await this.generateText({
        model: 'glm-4',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的文档处理助手。',
          },
          {
            role: 'user',
            content: `${task}\n\n文档内容：\n${content}`,
          },
        ],
        max_tokens: 4096,
      });

      return response.choices[0].message.content;
    } catch (error: any) {
      logger.error('Document parsing failed', { error: error.message });
      throw new AppError(500, error.message || '文档解析失败');
    }
  }

  // Excel操作
  async processExcel(instruction: string, data?: any): Promise<string> {
    this.checkConfig();
    
    logger.info('Excel processing request');

    try {
      const dataStr = data ? `\n\n数据：\n${JSON.stringify(data, null, 2)}` : '';
      
      const response = await this.generateText({
        model: 'glm-4',
        messages: [
          {
            role: 'system',
            content: '你是一个Excel处理专家。根据用户的要求处理数据，返回处理结果。',
          },
          {
            role: 'user',
            content: `${instruction}${dataStr}`,
          },
        ],
        max_tokens: 4096,
      });

      return response.choices[0].message.content;
    } catch (error: any) {
      logger.error('Excel processing failed', { error: error.message });
      throw new AppError(500, error.message || 'Excel处理失败');
    }
  }

  // 视频生成 (预留接口)
  async generateVideo(prompt: string, duration: number = 5): Promise<any> {
    this.checkConfig();
    
    logger.info('Video generation request', { prompt, duration });

    // 视频生成功能暂未开放
    throw new AppError(501, '视频生成功能暂未开放，请等待后续更新');
  }
}

// 导出单例实例
export const zhipuService = new ZhipuService();
