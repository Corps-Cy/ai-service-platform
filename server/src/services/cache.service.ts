import { createClient, RedisClientType } from 'ioredis';
import logger from '../utils/logger.js';

// Redis配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_CACHE_DB || '1'),
};

// 创建Redis客户端用于缓存
const cacheClient: RedisClientType = createClient(redisConfig) as any;

cacheClient.on('error', (error) => {
  logger.error('Cache Redis connection error', { error: error.message });
});

cacheClient.on('connect', () => {
  logger.info('Cache Redis connected successfully');
});

// 缓存键前缀
const CACHE_PREFIX = 'cache:';

// 缓存配置
export const CACHE_TTL = {
  SHORT: 60 * 5, // 5分钟
  MEDIUM: 60 * 30, // 30分钟
  LONG: 60 * 60 * 24, // 24小时
  VERY_LONG: 60 * 60 * 24 * 7, // 7天
};

// 生成缓存键
export function generateCacheKey(prefix: string, params: any): string {
  const paramString = typeof params === 'object'
    ? JSON.stringify(params, Object.keys(params).sort())
    : String(params);

  return `${CACHE_PREFIX}${prefix}:${Buffer.from(paramString).toString('base64')}`;
}

// 设置缓存
export async function setCache(
  key: string,
  value: any,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<void> {
  try {
    const serializedValue = JSON.stringify(value);
    await cacheClient.setex(key, ttl, serializedValue);

    logger.debug('Cache set', { key, ttl });
  } catch (error: any) {
    logger.error('Cache set error', { key, error: error.message });
  }
}

// 获取缓存
export async function getCache<T = any>(key: string): Promise<T | null> {
  try {
    const value = await cacheClient.get(key);

    if (value === null) {
      return null;
    }

    const parsed = JSON.parse(value) as T;

    logger.debug('Cache hit', { key });

    return parsed;
  } catch (error: any) {
    logger.error('Cache get error', { key, error: error.message });
    return null;
  }
}

// 删除缓存
export async function deleteCache(key: string): Promise<void> {
  try {
    await cacheClient.del(key);

    logger.debug('Cache deleted', { key });
  } catch (error: any) {
    logger.error('Cache delete error', { key, error: error.message });
  }
}

// 批量删除缓存（按模式）
export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await cacheClient.keys(`${CACHE_PREFIX}${pattern}`);

    if (keys.length > 0) {
      await cacheClient.del(...keys);
      logger.debug('Cache pattern deleted', { pattern, count: keys.length });
    }
  } catch (error: any) {
    logger.error('Cache pattern delete error', { pattern, error: error.message });
  }
}

// 缓存装饰器 - 自动缓存函数结果
export function cacheable(
  prefix: string,
  ttl: number = CACHE_TTL.MEDIUM,
  keyGenerator?: (...args: any[]) => any
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        const cacheKey = keyGenerator
          ? generateCacheKey(prefix, keyGenerator(...args))
          : generateCacheKey(prefix, args);

        // 尝试从缓存获取
        const cached = await getCache(cacheKey);
        if (cached !== null) {
          logger.debug('Cache decorator hit', { key: cacheKey });
          return cached;
        }

        // 执行原方法
        const result = await originalMethod.apply(this, args);

        // 缓存结果
        await setCache(cacheKey, result, ttl);

        return result;
      } catch (error: any) {
        logger.error('Cache decorator error', { error: error.message });
        // 缓存失败时仍然执行原方法
        return originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}

// 清除特定类型的缓存
export async function clearCacheByPrefix(prefix: string): Promise<void> {
  await deleteCachePattern(`${prefix}*`);
}

// 获取缓存统计
export async function getCacheStats(): Promise<{
  keys: number;
  memory: string;
  hitRate: number;
}> {
  try {
    const info = await cacheClient.info('stats');
    const memoryInfo = await cacheClient.info('memory');

    const keys = (await cacheClient.dbsize());
    const memory = memoryInfo.match(/used_memory_human:([^\r\n]+)/)?.[1] || 'unknown';
    const hitRate = parseFloat(info.match(/keyspace_hits:([^\r\n]+)/)?.[1] || '0');

    return {
      keys,
      memory,
      hitRate,
    };
  } catch (error: any) {
    logger.error('Get cache stats error', { error: error.message });
    return {
      keys: 0,
      memory: 'unknown',
      hitRate: 0,
    };
  }
}

// 刷新缓存TTL
export async function refreshCacheTTL(key: string, ttl: number): Promise<boolean> {
  try {
    const result = await cacheClient.expire(key, ttl);
    return result === 1;
  } catch (error: any) {
    logger.error('Refresh cache TTL error', { key, error: error.message });
    return false;
  }
}

// 关闭缓存连接
export async function closeCache(): Promise<void> {
  await cacheClient.quit();
  logger.info('Cache Redis disconnected');
}

export default {
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  generateCacheKey,
  cacheable,
  clearCacheByPrefix,
  getCacheStats,
  refreshCacheTTL,
  closeCache,
  CACHE_TTL,
};
