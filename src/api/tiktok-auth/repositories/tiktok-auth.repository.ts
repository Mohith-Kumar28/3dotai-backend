import { PrismaService } from '@/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { TikTokShopAuth } from '@prisma/client';
import {
  CreateTikTokAuthData,
  ITikTokAuthRepository,
  UpdateTikTokAuthData,
} from './tiktok-auth.repository.interface';

@Injectable()
export class TikTokAuthRepository implements ITikTokAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<TikTokShopAuth | null> {
    return this.prisma.tikTokShopAuth.findUnique({
      where: { userId },
    });
  }

  async findByShopId(shopId: string): Promise<TikTokShopAuth | null> {
    return this.prisma.tikTokShopAuth.findUnique({
      where: { shopId },
    });
  }

  async create(data: CreateTikTokAuthData): Promise<TikTokShopAuth> {
    return this.prisma.tikTokShopAuth.create({
      data,
    });
  }

  async update(
    userId: string,
    data: UpdateTikTokAuthData,
  ): Promise<TikTokShopAuth> {
    return this.prisma.tikTokShopAuth.update({
      where: { userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async delete(userId: string): Promise<void> {
    await this.prisma.tikTokShopAuth.delete({
      where: { userId },
    });
  }

  async findExpiredTokens(): Promise<TikTokShopAuth[]> {
    const now = new Date();
    return this.prisma.tikTokShopAuth.findMany({
      where: {
        OR: [
          {
            accessTokenExpiresAt: {
              lte: new Date(now.getTime() + 5 * 60 * 1000), // 5 minutes before expiry
            },
          },
          {
            refreshTokenExpiresAt: {
              lte: now,
            },
          },
        ],
        isActive: true,
      },
    });
  }
}
