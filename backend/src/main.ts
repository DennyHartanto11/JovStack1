import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser = require('cookie-parser');
import helmet from 'helmet';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const isProd = config.get<string>('env') === 'production';
  const apiPrefix = config.get<string>('apiPrefix')!;
  // Keep the banner + health probe reachable at the bare root (load balancers
  // and uptime checks hit "/"), everything else lives under the API prefix.
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['', 'health', '__site', 'site/:slug'],
  });

  // Helmet hardens HTTP headers. Override Cross-Origin-Resource-Policy so the
  // frontend (different port) can load images served from /static/*.
  // By default helmet sets CORP: same-origin which blocks cross-origin image loads.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());

  const corsOrigins = config.get<string[]>('corsOrigins') ?? ['http://localhost:3000'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id'],
  });

  // Flush in-flight requests on SIGTERM/SIGINT (k8s/Docker rolling restarts).
  app.enableShutdownHooks();

  // Serve uploaded media (local storage backend).
  // Also set CORS + CORP headers on static files so cross-origin <img> and
  // CSS background-image requests from the frontend (port 3000) succeed.
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/static/',
    setHeaders(res: import('http').ServerResponse) {
      const origin = corsOrigins[0] ?? 'http://localhost:3000';
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });

  // OpenAPI docs — disabled in production to avoid exposing the API surface.
  if (!isProd) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('JovStack API')
      .setDescription('Multi-tenant SaaS website builder API')
      .setVersion('1.0')
      .addBearerAuth()
      .addGlobalParameters({
        name: 'X-Organization-Id',
        in: 'header',
        required: false,
        schema: { type: 'string' },
      })
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  }

  const port = config.get<number>('port')!;
  await app.listen(port);
  logger.log(`JovStack API listening on port ${port} (prefix /${apiPrefix})`);
  if (!isProd) logger.log(`Swagger docs at /${apiPrefix}/docs`);
}

bootstrap();
