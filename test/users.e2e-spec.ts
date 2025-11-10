import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';
import { UsersRepository } from '../src/users/repositories/users-pg.repository';
import { UsersCacheService } from '../src/users/cache/users-cache.service';
import { UsersMetricsService } from '../src/users/metrics/users-metrics.service';
import { UserBalanceDto } from '../src/users/dto/user-balance.dto';
import {
  InsufficientBalanceError,
  UserNotFoundError,
} from '../src/users/errors/user-domain.errors';

class InMemoryUsersRepository {
  private user = {
    id: 1,
    balance: 200,
    created_at: new Date(),
    updated_at: new Date(),
  };

  async ensureDefaultUser(): Promise<void> {}

  async findById(userId: number) {
    if (userId !== this.user.id) {
      return undefined;
    }
    return { ...this.user };
  }

  async debitUserBalance(userId: number, amount: number) {
    if (userId !== this.user.id) {
      throw new UserNotFoundError(userId);
    }

    if (this.user.balance < amount) {
      throw new InsufficientBalanceError(userId);
    }

    this.user.balance -= amount;
    this.user.updated_at = new Date();
    return { ...this.user };
  }
}

class InMemoryUsersCacheService {
  private readonly store = new Map<number, UserBalanceDto>();

  async getBalanceSnapshot(userId: number): Promise<UserBalanceDto | null> {
    return this.store.get(userId) ?? null;
  }

  async setBalanceSnapshot(
    userId: number,
    snapshot: UserBalanceDto,
  ): Promise<void> {
    this.store.set(userId, snapshot);
  }
}

class NoopUsersMetricsService {
  recordBalanceRead(): void {}
  recordDebitSuccess(): void {}
  recordDebitFailure(): void {}
}

describe('UsersController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        { provide: UsersRepository, useClass: InMemoryUsersRepository },
        { provide: UsersCacheService, useClass: InMemoryUsersCacheService },
        { provide: UsersMetricsService, useClass: NoopUsersMetricsService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('performs balance read and debit flow', async () => {
    const initialResponse = await app.inject({
      method: 'GET',
      url: '/users/1',
    });
    expect(initialResponse.statusCode).toBe(200);
    expect(JSON.parse(initialResponse.payload)).toMatchObject({
      id: 1,
      balance: 200,
    });

    const debitResponse = await app.inject({
      method: 'POST',
      url: '/users/1/debit',
      payload: { amount: 50 },
    });
    expect(debitResponse.statusCode).toBe(201);
    expect(JSON.parse(debitResponse.payload)).toMatchObject({
      id: 1,
      balance: 150,
    });

    const finalResponse = await app.inject({ method: 'GET', url: '/users/1' });
    expect(finalResponse.statusCode).toBe(200);
    expect(JSON.parse(finalResponse.payload)).toMatchObject({
      id: 1,
      balance: 150,
    });
  });

  it('validates debit payload', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/users/1/debit',
      payload: { amount: 0 },
    });
    expect(response.statusCode).toBe(400);
  });
});
