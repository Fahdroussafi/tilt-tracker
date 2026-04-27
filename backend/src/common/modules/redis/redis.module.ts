import { CacheModule } from '@nestjs/cache-manager';
import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';
import Redis from 'ioredis';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('RedisModule');
        const host = configService.get<string>('REDIS_HOST');
        const port = configService.get<number>('REDIS_PORT');

        if (!host || !port) {
          logger.warn('Redis configuration missing, falling back to in-memory cache');
          return { store: 'memory', ttl: 300 * 1000 };
        }

        try {
          const store = await redisStore({
            socket: { host, port },
          });
          return { store, ttl: 300 * 1000 };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          logger.error(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            `Failed to connect to Redis: ${error.message}. Falling back to in-memory cache`,
          );
          return { store: 'memory', ttl: 300 * 1000 };
        }
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('RedisClient');
        const host = configService.get<string>('REDIS_HOST');
        const port = configService.get<number>('REDIS_PORT');

        const client = new Redis({
          host: host || 'localhost',
          port: port || 6379,
          lazyConnect: true,
          maxRetriesPerRequest: 0, // Don't block
        });

        client.on('error', (err) => {
          logger.warn(`Redis client error: ${err.message}. Features requiring Redis may not work.`);
        });

        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [CacheModule, 'REDIS_CLIENT'],
})
export class RedisModule {}
