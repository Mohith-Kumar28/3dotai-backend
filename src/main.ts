import fastifyCookie from '@fastify/cookie';
import {
  ClassSerializerInterceptor,
  HttpStatus,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import * as Sentry from '@sentry/node';
import helmet from 'helmet';
import { setupGracefulShutdown } from 'nestjs-graceful-shutdown';

import path from 'path';
import { AppModule } from './app.module';
import { getConfig as getAppConfig } from './config/app/app.config';
import { BULL_BOARD_PATH } from './config/bull/bull.config';
import { type GlobalConfig } from './config/config.type';
import { Environment } from './constants/app.constant';
import { SentryInterceptor } from './interceptors/sentry.interceptor';
import { basicAuthMiddleware } from './middlewares/basic-auth.middleware';
import { RedisIoAdapter } from './shared/socket/redis.adapter';
import { consoleLoggingConfig } from './tools/logger/logger-factory';
import setupSwagger, { SWAGGER_PATH } from './tools/swagger/swagger.setup';

async function bootstrap() {
  const envToLogger: Record<`${Environment}`, any> = {
    local: consoleLoggingConfig(),
    development: consoleLoggingConfig(),
    production: true,
    staging: true,
    test: false,
  } as const;

  const appConfig = getAppConfig();

  const isWorker = appConfig.isWorker;

  const app = await NestFactory.create<NestFastifyApplication>(
    isWorker ? AppModule.worker() : AppModule.main(),
    new FastifyAdapter({
      logger: appConfig.appLogging ? envToLogger[appConfig.nodeEnv] : false,
      trustProxy: appConfig.isHttps,
    }),
    {
      bufferLogs: true,
    },
  );

  const configService = app.get(ConfigService<GlobalConfig>);

  await app.register(fastifyCookie as any, {
    secret: configService.getOrThrow('auth.authSecret', {
      infer: true,
    }) as string,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      exceptionFactory: (errors: ValidationError[]) => {
        return new UnprocessableEntityException(errors);
      },
    }),
  );
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Get environment configuration
  const env = configService.getOrThrow('app.nodeEnv', {
    infer: true,
  }) as Environment;
  const isDevelopment = [Environment.Local, Environment.Development].includes(
    env,
  );
  const port = configService.getOrThrow('app.port', {
    infer: true,
  });

  // Configure CORS based on environment
  const corsOptions = isDevelopment
    ? {
        // Development: Allow all origins with credentials
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          'Accept',
          'apollo-client-name',
          'apollo-client-version',
          'apollo-require-preflight',
        ],
        exposedHeaders: ['Authorization'],
        credentials: true,
        maxAge: 600, // 10 minutes
      }
    : {
        // Production: Restrict to specific origins
        origin: [
          'https://studio.apollographql.com',
          ...(configService.get('app.corsOrigin', { infer: true })
            ? [configService.get('app.corsOrigin', { infer: true }) as string]
            : []),
        ],
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Authorization'],
        credentials: true,
        maxAge: 600, // 10 minutes
      };

  // Apply CORS configuration
  app.enableCors(corsOptions);

  // Security headers configuration
  const securityHeaders: Parameters<typeof helmet>[0] = {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'https://cdn.jsdelivr.net',
          'https://embeddable-sandbox.cdn.apollographql.com',
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net',
          'https://embeddable-sandbox.cdn.apollographql.com',
        ],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://cdn.jsdelivr.net',
          'https://embeddable-sandbox.cdn.apollographql.com',
        ],
        connectSrc: [
          "'self'",
          'ws:',
          'wss:',
          'https://api.apollographql.com',
          'https://rover-graphql.api.apollographql.com',
          `http://localhost:${port}`,
          `http://127.0.0.1:${port}`,
        ],
        fontSrc: ["'self'", 'data:', 'https://cdn.jsdelivr.net'],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        ...(isDevelopment ? {} : { upgradeInsecureRequests: [] }),
      },
    },
    crossOriginEmbedderPolicy: false, // Required for Apollo Sandbox
    crossOriginOpenerPolicy: { policy: 'same-origin' as const },
    crossOriginResourcePolicy: { policy: 'cross-origin' as const },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' as const },
  };

  // Apply security headers
  app.use(helmet(securityHeaders));

  // Static files
  app.useStaticAssets({
    root: path.join(__dirname, '..', 'src', 'tmp', 'file-uploads'),
    prefix: '/public',
    setHeaders(res: any) {
      res.setHeader(
        'Access-Control-Allow-Origin',
        configService.getOrThrow('app.corsOrigin', {
          infer: true,
        }),
      );
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });

  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  if (env !== 'production') {
    setupSwagger(app);
  }

  Sentry.init({
    dsn: configService.getOrThrow('sentry.dsn', { infer: true }),
    tracesSampleRate: 1.0,
    environment: env,
  });
  app.useGlobalInterceptors(new SentryInterceptor());

  if (env !== 'local') {
    setupGracefulShutdown({ app });
  }

  if (!isWorker) {
    app.useWebSocketAdapter(new RedisIoAdapter(app));
  }

  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onRequest', async (req, reply) => {
      const pathsToIntercept = [
        `/api${BULL_BOARD_PATH}`, // Bull-Board
        SWAGGER_PATH, // Swagger Docs
        `/api/auth/reference`, // Better Auth Docs
      ];
      if (pathsToIntercept.some((path) => req.url.startsWith(path))) {
        await basicAuthMiddleware(req as any, reply as any);
      }
    });

  await app.listen({
    port: isWorker
      ? configService.getOrThrow('app.workerPort', { infer: true })
      : configService.getOrThrow('app.port', { infer: true }),
    host: '0.0.0.0',
  });

  const httpUrl = await app.getUrl();
  // eslint-disable-next-line no-console
  console.info(
    `\x1b[3${isWorker ? '3' : '4'}m${isWorker ? 'Worker ' : ''}Server running at ${httpUrl}`,
  );

  return app;
}

void bootstrap();
