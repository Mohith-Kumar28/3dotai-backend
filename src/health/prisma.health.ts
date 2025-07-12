import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async isHealthy(
    key: string,
    options?: { timeout?: number },
  ): Promise<HealthIndicatorResult> {
    try {
      // Use the timeout if provided, otherwise use a default
      const timeout = options?.timeout ?? 5000;

      // Use Promise.race to implement the timeout
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Database query timeout')),
            timeout,
          ),
        ),
      ]);

      return this.getStatus(key, true);
    } catch (error) {
      return this.getStatus(key, false, { error: error.message });
    }
  }
}
