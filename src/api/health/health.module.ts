import { PrismaModule } from '@/database/prisma/prisma.module';
import { PrismaHealthIndicator } from '@/health/prisma.health';
import { SocketModule } from '@/shared/socket/socket.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, HttpModule, SocketModule, PrismaModule],
  controllers: [HealthController],
  providers: [PrismaHealthIndicator],
})
export class HealthModule {}
