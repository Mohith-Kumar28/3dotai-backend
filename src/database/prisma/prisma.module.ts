import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import prismaConfig from '../../config/database/prisma.config';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  imports: [ConfigModule.forFeature(prismaConfig)],
  providers: [
    {
      provide: PrismaService,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new PrismaService(configService);
      },
    },
  ],
  exports: [PrismaService],
})
export class PrismaModule {}
