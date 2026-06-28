import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  const allowedOrigins = process.env.WEB_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean);
  if (process.env.NODE_ENV === 'production' && (!allowedOrigins || allowedOrigins.length === 0)) {
    throw new Error('WEB_ORIGIN must be set in production (comma-separated allowlist)');
  }
  app.enableCors({
    // Fail-closed by default: in dev we allow localhost; in prod the allowlist must be explicit.
    origin: allowedOrigins ?? ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  Logger.log(`Lumin API listening on :${port}`, 'Bootstrap');
}

void bootstrap();
