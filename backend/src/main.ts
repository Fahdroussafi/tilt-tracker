import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { setupSwagger } from './common/config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'fatal'],
  });

  app.use(cookieParser());

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  const isProduction = nodeEnv === 'production';

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: (origin, callback) => {
      if (!isProduction) {
        return callback(null, true);
      }
      const corsOrigins = configService.get<string>('CORS_ORIGINS');
      if (!origin || (corsOrigins && corsOrigins.split(',').includes(origin))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  const enableSwagger = configService.get<string>('ENABLE_SWAGGER') !== 'false';
  if (enableSwagger) {
    setupSwagger(app);
  }

  app.enableShutdownHooks();

  const logger = new Logger('Bootstrap');
  const port = configService.get<number>('PORT') || 8000;
  await app.listen(port);

  const baseUrl = await app.getUrl();
  logger.log(`Tilt Tracker API (${nodeEnv}) is running on: ${baseUrl}`);

  if (enableSwagger) {
    logger.log(`Swagger: ${baseUrl}/api`);
  }
}
void bootstrap();
