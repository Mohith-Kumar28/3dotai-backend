import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaConfig } from '../../config/database/prisma.config';

type BeforeExitHandler = () => Promise<void>;

declare module '@prisma/client' {
  interface PrismaClient {
    $on(event: 'beforeExit', handler: BeforeExitHandler): void;
  }
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {
    const prismaConfig = configService.get<PrismaConfig>('prisma');

    super({
      datasources: {
        db: {
          url: prismaConfig?.url,
        },
      },
      log: prismaConfig?.logging
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
