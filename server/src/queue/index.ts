import Queue, { Job, QueueOptions } from 'bull';
import ioredis from 'ioredis';
import logger from '../utils/logger.js';
import { zhipuService } from '../services/zhipu.service.js';

// Redis配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
};

// 创建Redis连接
const redisConnection = new ioredis(redisConfig);

redisConnection.on('error', (error) => {
  logger.error('Redis connection error', { error: error.message });
});

redisConnection.on('connect', () => {
  logger.info('Redis connected successfully');
});

// 队列配置
const queueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // 24小时后删除完成的任务
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // 7天后删除失败的任务
    },
  },
};

// 任务队列
export const taskQueue = new Queue('ai-tasks', queueOptions);
export const emailQueue = new Queue('email-tasks', queueOptions);

// 任务类型定义
export interface TaskJobData {
  taskId: string;
  userId: number;
  type: 'text-gen' | 'image-gen' | 'image-understand' | 'document-process' | 'excel-process';
  params: any;
}

// 邮件任务类型定义
export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// 处理AI任务
taskQueue.process('ai-task', async (job: Job<TaskJobData>) => {
  const { taskId, userId, type, params } = job.data;

  logger.info('Processing AI task', { taskId, type, userId });

  try {
    let result: any;

    switch (type) {
      case 'text-gen':
        result = await zhipuService.generateText(params);
        break;

      case 'image-gen':
        result = await zhipuService.generateImage(params);
        break;

      case 'image-understand':
        result = await zhipuService.understandImage(params);
        break;

      case 'document-process':
        result = await zhipuService.parseDocument(params.content, params.task);
        break;

      case 'excel-process':
        result = await zhipuService.processExcel(params.instruction, params.data);
        break;

      default:
        throw new Error(`Unknown task type: ${type}`);
    }

    logger.info('AI task completed', { taskId, type });

    return {
      taskId,
      type,
      status: 'completed',
      result,
    };
  } catch (error: any) {
    logger.error('AI task failed', {
      taskId,
      type,
      error: error.message,
    });

    throw error;
  }
});

// 处理邮件任务
emailQueue.process('send-email', async (job: Job<EmailJobData>) => {
  const { to, subject, html, text } = job.data;

  logger.info('Sending email', { to, subject });

  // 这里可以集成邮件服务，如 nodemailer
  // 暂时只记录日志
  logger.info('Email sent', { to, subject, bodyLength: html.length });

  return { to, subject, sent: true };
});

// 添加AI任务到队列
export async function addAITask(data: TaskJobData, options?: any) {
  const job = await taskQueue.add('ai-task', data, {
    priority: getTaskPriority(data.type),
    ...options,
  });

  logger.info('AI task added to queue', {
    jobId: job.id,
    taskId: data.taskId,
    type: data.type,
  });

  return job;
}

// 添加邮件任务到队列
export async function addEmailTask(data: EmailJobData) {
  const job = await emailQueue.add('send-email', data);

  logger.info('Email task added to queue', {
    jobId: job.id,
    to: data.to,
    subject: data.subject,
  });

  return job;
}

// 获取任务优先级
function getTaskPriority(type: string): number {
  const priorities: Record<string, number> = {
    'text-gen': 5,
    'image-gen': 3, // 图片生成通常耗时更长，优先级稍低
    'image-understand': 5,
    'document-process': 4,
    'excel-process': 4,
  };

  return priorities[type] || 5;
}

// 获取任务状态
export async function getTaskStatus(taskId: string) {
  const jobs = await taskQueue.getJobs(['waiting', 'active', 'completed', 'failed']);

  for (const job of jobs) {
    if (job.data.taskId === taskId) {
      return {
        id: job.id,
        taskId,
        status: await job.getState(),
        progress: job.progress(),
        data: job.data,
        result: job.returnvalue,
        failedReason: job.failedReason,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
      };
    }
  }

  return null;
}

// 获取队列统计
export async function getQueueStats() {
  const [waiting, active, completed, failed] = await Promise.all([
    taskQueue.getWaiting(),
    taskQueue.getActive(),
    taskQueue.getCompleted(),
    taskQueue.getFailed(),
  ]);

  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
  };
}

// 清理队列
export async function cleanQueue(grace: number = 5000) {
  await taskQueue.clean(grace);
  await emailQueue.clean(grace);

  logger.info('Queues cleaned', { grace });
}

// 关闭队列连接
export async function closeQueues() {
  await taskQueue.close();
  await emailQueue.close();
  await redisConnection.quit();

  logger.info('Queues closed');
}

// 监听队列事件
taskQueue.on('completed', (job: Job, result: any) => {
  logger.info('Task completed', {
    jobId: job.id,
    taskId: job.data.taskId,
    type: job.data.type,
  });
});

taskQueue.on('failed', (job: Job | undefined, error: Error) => {
  logger.error('Task failed', {
    jobId: job?.id,
    taskId: job?.data.taskId,
    type: job?.data.type,
    error: error.message,
  });
});

taskQueue.on('stalled', (job: Job) => {
  logger.warn('Task stalled', {
    jobId: job.id,
    taskId: job.data.taskId,
    type: job.data.type,
  });
});

export { redisConnection };
