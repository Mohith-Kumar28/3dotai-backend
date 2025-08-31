import { StringField } from '@/decorators/field.decorators';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class TikTokAuthCallbackDto {
  @ApiProperty({
    description: 'Authorization code from TikTok',
    example: 'auth_code_123456',
  })
  @IsString()
  code: string;

  @ApiPropertyOptional({
    description: 'State parameter for CSRF protection',
    example: 'random-state-string',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Shop ID from TikTok',
    example: 'shop_123456',
  })
  @IsOptional()
  @IsString()
  shop_id?: string;

  @ApiPropertyOptional({
    description: 'Shop region',
    example: 'US',
  })
  @IsOptional()
  @IsString()
  shop_region?: string;
}

@Exclude()
export class TikTokAuthResponseDto {
  @ApiProperty({
    description: 'Authorization URL to redirect user to',
    example: 'https://services.tiktokshop.com/open/authorize?...',
  })
  @StringField()
  @Expose()
  authUrl: string;

  @ApiProperty({
    description: 'State parameter for CSRF protection',
    example: 'random-state-string',
  })
  @StringField()
  @Expose()
  state: string;
}

@Exclude()
export class TikTokShopInfoDto {
  @ApiProperty({
    description: 'Shop ID',
    example: 'shop_123456',
  })
  @StringField()
  @Expose()
  shopId: string;

  @ApiPropertyOptional({
    description: 'Shop name',
    example: 'My TikTok Shop',
  })
  @StringField({ nullable: true })
  @Expose()
  shopName?: string;

  @ApiProperty({
    description: 'Shop region',
    example: 'US',
  })
  @StringField()
  @Expose()
  region: string;

  @ApiProperty({
    description: 'Whether the shop is currently active',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'When the authorization was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'When the authorization was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updatedAt: Date;
}

@Exclude()
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  @Expose()
  success: boolean;

  @ApiProperty({
    description: 'Message',
    example: 'Token refreshed successfully',
  })
  @StringField()
  @Expose()
  message: string;
}

@Exclude()
export class TikTokAuthStatusDto {
  @ApiProperty({
    description: 'Whether the user has an active TikTok Shop connection',
    example: true,
  })
  @Expose()
  isConnected: boolean;

  @ApiProperty({
    description: 'Shop ID if connected',
    example: 'shop_123456',
    nullable: true,
  })
  @StringField({ nullable: true })
  @Expose()
  shopId?: string;

  @ApiProperty({
    description: 'Shop name if connected',
    example: 'My TikTok Shop',
    nullable: true,
  })
  @StringField({ nullable: true })
  @Expose()
  shopName?: string;
}
