import { Module } from '@nestjs/common';
import { TikTokApiClientService } from './tiktok-api-client.service';

@Module({
  providers: [TikTokApiClientService],
  exports: [TikTokApiClientService],
})
export class TikTokServicesModule {}
