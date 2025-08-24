import { Module } from '@nestjs/common';
import { FileModule } from './file/file.module';
import { HealthModule } from './health/health.module';
import { TikTokModule } from './tiktok/tiktok.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [HealthModule, UserModule, FileModule, TikTokModule],
})
export class ApiModule {}
