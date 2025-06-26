import Redis from 'ioredis';

// Create a singleton Redis instance for BullMQ
class RedisClient {
  private static instance: Redis;

  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      // Use environment variables for Redis configuration
      const redisUrl = process.env.REDIS_URL;
      
      if (redisUrl) {
        RedisClient.instance = new Redis(redisUrl, {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          autoResubscribe: false,
          autoResendUnfulfilledCommands: false,
          lazyConnect: true,
        });
      } else {
        // Default local Redis configuration
        RedisClient.instance = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB || '0'),
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          autoResubscribe: false,
          autoResendUnfulfilledCommands: false,
          lazyConnect: true,
        });
      }

      // Add error handling
      RedisClient.instance.on('error', (error) => {
        console.error('Redis connection error:', error);
      });

      RedisClient.instance.on('connect', () => {
        console.log('Redis connected successfully');
      });

      RedisClient.instance.on('ready', () => {
        console.log('Redis is ready to accept commands');
      });
    }

    return RedisClient.instance;
  }

  public static async disconnect(): Promise<void> {
    if (RedisClient.instance) {
      await RedisClient.instance.quit();
    }
  }
}

export const redis = RedisClient.getInstance();
export default RedisClient;
