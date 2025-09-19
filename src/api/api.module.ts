import { Module } from '@nestjs/common';
import { ChatModule } from './chat/chat.module';
import { FileModule } from './file/file.module';
import { HealthModule } from './health/health.module';
import { TikTokModule } from './tiktok-auth/tiktok.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [HealthModule, UserModule, FileModule, TikTokModule, ChatModule],
})
export class ApiModule {}
