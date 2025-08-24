import { PrismaModule } from '@/database/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { TikTokAuthRepository } from './repositories/tiktok-auth.repository';
import { TIKTOK_AUTH_REPOSITORY } from './repositories/tiktok-auth.repository.interface';
import { TikTokController } from './tiktok.controller';
import { TikTokService } from './tiktok.service';

@Module({
  imports: [PrismaModule],
  controllers: [TikTokController],
  providers: [
    TikTokService,
    {
      provide: TIKTOK_AUTH_REPOSITORY,
      useClass: TikTokAuthRepository,
    },
  ],
  exports: [TikTokService],
})
export class TikTokModule {}
