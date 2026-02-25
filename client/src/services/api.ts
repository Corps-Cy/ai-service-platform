import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // 初始化
  checkInitStatus: () => api.get('/init/status'),
  saveInitConfig: (config: any) => api.post('/init/save-config', config),
  getCurrentConfig: () => api.get('/init/current'),

  // 认证
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, nickname: string) =>
    api.post('/auth/register', { email, password, nickname }),

  // 用户
  getUserInfo: () => api.get('/user/info'),
  updateUserInfo: (data: any) => api.put('/user/info', data),

  // 任务
  createImageTask: (prompt: string, size?: string, num?: number) =>
    api.post('/tasks/image', { prompt, size, num }),
  createTextTask: (model: string, messages: any[]) =>
    api.post('/tasks/text', { model, messages }),
  createImageUnderstandTask: (image: string, prompt: string) =>
    api.post('/tasks/image-understand', { image, prompt }),
  createDocumentTask: (content: string, task: string) =>
    api.post('/tasks/document', { content, task }),
  createExcelTask: (instruction: string, data?: any) =>
    api.post('/tasks/excel', { instruction, data }),
  createVideoTask: (prompt: string, duration?: number) =>
    api.post('/tasks/video', { prompt, duration }),
  getTasks: (limit?: number, offset?: number) =>
    api.get('/tasks', { params: { limit, offset } }),
  getTask: (taskId: string) => api.get(`/tasks/${taskId}`),

  // 支付
  createOrder: (type: string, productId: string, amount: number, paymentMethod: string, description?: string) =>
    api.post('/payment/create', { type, productId, amount, paymentMethod, description }),
  getOrder: (orderNo: string) => api.get(`/payment/order/${orderNo}`),
  getOrders: (limit?: number, offset?: number) =>
    api.get('/payment/orders', { params: { limit, offset } }),

  // 定价
  getPricing: () => api.get('/pricing'),
  getPlans: () => api.get('/pricing/plans'),
  getPlan: (id: string) => api.get(`/pricing/plans/${id}`),
};

export default api;
