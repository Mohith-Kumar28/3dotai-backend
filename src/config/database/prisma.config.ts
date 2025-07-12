import validateConfig from '@/utils/config/validate-config';
import { registerAs } from '@nestjs/config';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

class EnvironmentVariablesValidator {
  @ValidateIf((envValues) => envValues.DATABASE_URL)
  @IsString()
  DATABASE_URL: string;

  @ValidateIf((envValues) => !envValues.DATABASE_URL)
  @IsString()
  DATABASE_HOST: string;

  @ValidateIf((envValues) => !envValues.DATABASE_URL)
  @IsInt()
  @Min(0)
  @Max(65535)
  DATABASE_PORT: number;

  @ValidateIf((envValues) => !envValues.DATABASE_URL)
  @IsString()
  DATABASE_PASSWORD: string;

  @ValidateIf((envValues) => !envValues.DATABASE_URL)
  @IsString()
  DATABASE_NAME: string;

  @ValidateIf((envValues) => !envValues.DATABASE_URL)
  @IsString()
  DATABASE_USERNAME: string;

  @IsBoolean()
  @IsOptional()
  DATABASE_LOGGING: boolean;
}

export type PrismaConfig = {
  url: string;
  logging: boolean;
};

export const PRISMA_CONFIG_KEY = 'prisma';

const prismaConfig = registerAs<PrismaConfig>(PRISMA_CONFIG_KEY, () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  // Use DATABASE_URL if provided, otherwise construct from individual parts
  const url =
    process.env.DATABASE_URL ||
    `postgresql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}?schema=public`;

  return {
    url,
    logging: process.env.DATABASE_LOGGING === 'true',
  };
});

export default prismaConfig;
