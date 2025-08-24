import { TikTokShopAuth } from '@prisma/client';

export const TIKTOK_AUTH_REPOSITORY = 'TIKTOK_AUTH_REPOSITORY';

export interface ITikTokAuthRepository {
  findByUserId(userId: string): Promise<TikTokShopAuth | null>;
  findByShopId(shopId: string): Promise<TikTokShopAuth | null>;
  create(data: CreateTikTokAuthData): Promise<TikTokShopAuth>;
  update(userId: string, data: UpdateTikTokAuthData): Promise<TikTokShopAuth>;
  delete(userId: string): Promise<void>;
  findExpiredTokens(): Promise<TikTokShopAuth[]>;
}

export interface CreateTikTokAuthData {
  userId: string;
  shopId: string;
  shopName?: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  scope?: string[];
  region?: string;
}

export interface UpdateTikTokAuthData {
  shopName?: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  scope?: string[];
  region?: string;
  isActive?: boolean;
}
