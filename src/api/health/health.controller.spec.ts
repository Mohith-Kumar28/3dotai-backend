import { AuthService } from '@/auth/auth.service';
import { GlobalConfig } from '@/config/config.type';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import {
  HealthCheckService,
  HttpHealthIndicator,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaHealthIndicator } from '../../health/prisma.health';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthCheckService;
  let configServiceValue: Partial<
    Record<keyof ConfigService<GlobalConfig>, jest.Mock>
  >;
  let healthCheckServiceValue: Partial<
    Record<keyof HealthCheckService, jest.Mock>
  >;
  let httpUseValue: Partial<Record<keyof HttpHealthIndicator, jest.Mock>>;
  let prismaUseValue: Partial<Record<keyof PrismaHealthIndicator, jest.Mock>>;
  let microServiceValue: Partial<
    Record<keyof MicroserviceHealthIndicator, jest.Mock>
  >;
  let authServiceValue: Partial<Record<keyof AuthService, jest.Mock>>;

  beforeAll(async () => {
    configServiceValue = {
      get: jest.fn(),
      getOrThrow: jest.fn().mockReturnValue({
        host: 'localhost',
        port: 6379,
      }),
    };

    healthCheckServiceValue = {
      check: jest.fn(),
    };

    httpUseValue = {
      pingCheck: jest.fn(),
    };

    prismaUseValue = {
      isHealthy: jest.fn(),
    };

    microServiceValue = {
      pingCheck: jest.fn(),
    };

    authServiceValue = {
      createBasicAuthHeaders: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: ConfigService,
          useValue: configServiceValue,
        },
        {
          provide: HealthCheckService,
          useValue: healthCheckServiceValue,
        },
        {
          provide: HttpHealthIndicator,
          useValue: httpUseValue,
        },
        {
          provide: PrismaHealthIndicator,
          useValue: prismaUseValue,
        },
        {
          provide: MicroserviceHealthIndicator,
          useValue: microServiceValue,
        },
        {
          provide: AuthService,
          useValue: authServiceValue,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthCheckService>(HealthCheckService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('check', () => {
    it('should return health check result in production environment', async () => {
      // Mock config to return production environment
      (configServiceValue.get as jest.Mock).mockImplementation(
        (key: string) => {
          if (key === 'app.nodeEnv') return 'production';
          return null;
        },
      );

      const healthCheckResult = {
        status: 'ok',
        info: {
          database: { status: 'up' },
          redis: { status: 'up' },
        },
        error: {},
        details: {
          database: { status: 'up' },
          redis: { status: 'up' },
        },
      };

      // Mock the health check service
      (service.check as jest.Mock).mockImplementation(async (checks) => {
        // Simulate the health check calls
        await Promise.all(checks.map((check: () => Promise<any>) => check()));
        return healthCheckResult;
      });

      const result = await controller.check();

      expect(result).toEqual(healthCheckResult);
      expect(service.check).toHaveBeenCalled();

      // Verify database health check
      expect(prismaUseValue.isHealthy).toHaveBeenCalledWith('database', {
        timeout: 5000,
      });

      // Verify Redis health check
      expect(microServiceValue.pingCheck).toHaveBeenCalledWith('redis', {
        transport: Transport.REDIS,
        options: expect.any(Object),
      });

      // Verify API docs health check is not called in production
      expect(httpUseValue.pingCheck).not.toHaveBeenCalled();
    });

    it('should return health check result in non-production environment', async () => {
      // Mock config to return non-production environment
      (configServiceValue.get as jest.Mock).mockImplementation(
        (key: string) => {
          if (key === 'app.nodeEnv') return 'development';
          if (key === 'app.url') return 'http://localhost:3000';
          return null;
        },
      );

      const healthCheckResult = {
        status: 'ok',
        info: {
          database: { status: 'up' },
          redis: { status: 'up' },
          'api-docs': { status: 'up' },
        },
        error: {},
        details: {
          database: { status: 'up' },
          redis: { status: 'up' },
          'api-docs': { status: 'up' },
        },
      };

      // Mock the health check service
      (service.check as jest.Mock).mockImplementation(async (checks) => {
        // Simulate the health check calls
        await Promise.all(checks.map((check: () => Promise<any>) => check()));
        return healthCheckResult;
      });

      // Mock the auth service
      (authServiceValue.createBasicAuthHeaders as jest.Mock).mockReturnValue(
        {},
      );

      const result = await controller.check();

      expect(result).toEqual(healthCheckResult);
      expect(service.check).toHaveBeenCalled();

      // Verify database health check
      expect(prismaUseValue.isHealthy).toHaveBeenCalledWith('database', {
        timeout: 5000,
      });

      // Verify Redis health check
      expect(microServiceValue.pingCheck).toHaveBeenCalledWith('redis', {
        transport: Transport.REDIS,
        options: expect.any(Object),
      });

      // Verify API docs health check in non-production
      expect(httpUseValue.pingCheck).toHaveBeenCalledWith(
        'api-docs',
        'http://localhost:3000/api-docs',
        { headers: {} },
      );
    });
  });
});
