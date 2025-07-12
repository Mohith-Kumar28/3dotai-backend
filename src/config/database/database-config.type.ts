import { registerAs } from '@nestjs/config';

export type DatabaseConfig = {
  url?: string;
  host?: string;
  port?: number;
  name?: string;
  username?: string;
  password?: string;
  logging: boolean;
  ssl?:
    | {
        rejectUnauthorized?: boolean;
        ca?: string;
        key?: string;
        cert?: string;
      }
    | boolean;
};

export default registerAs<DatabaseConfig>('database', () => ({
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT
    ? parseInt(process.env.DATABASE_PORT, 10)
    : 5432,
  name: process.env.DATABASE_NAME,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  logging: process.env.DATABASE_LOGGING === 'true',
}));
