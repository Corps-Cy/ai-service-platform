import axiosRetry, { IAxiosRetryConfig } from 'axios-retry';
import axios from 'axios';
import logger from './logger.js';

// 重试配置
const retryConfig: IAxiosRetryConfig = {
  retries: 3,
  retryCondition: (error) => {
    // 仅对网络错误或5xx错误重试
    const isNetworkError = !error.response;
    const isServerError = error.response?.status !== undefined && error.response.status >= 500;
    const isRateLimitError = error.response?.status === 429;
    
    // 429 (限流) 和网络错误可以重试
    return isNetworkError || isServerError || isRateLimitError;
  },
  onRetry: (retryCount, error, requestConfig) => {
    logger.warn(`Retry attempt ${retryCount} for ${requestConfig.url}`, {
      error: error.message,
      retryCount,
    });
  },
  shouldResetTimeout: true,
  retryDelay: (retryCount) => {
    // 指数退避：1s, 2s, 4s
    return 1000 * Math.pow(2, retryCount);
  },
};

// 创建带重试的axios实例
const apiClient = axios.create();
axiosRetry(apiClient, retryConfig);

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    logger.http({
      method: config.method?.toUpperCase(),
      url: config.url,
      data: config.data,
    });
    return config;
  },
  (error) => {
    logger.error('API Request Error:', {
      url: error.config?.url,
      method: error.config?.method,
      error: error.message,
    });
    return Promise.reject(error);
  }
);

export default apiClient;
