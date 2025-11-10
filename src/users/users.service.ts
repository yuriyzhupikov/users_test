import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { UsersRepository } from './repositories/users-pg.repository';
import { toUserBalanceDto, UserBalanceDto } from './dto/user-balance.dto';
import {
  InsufficientBalanceError,
  UserNotFoundError,
} from './errors/user-domain.errors';
import { UsersCacheService } from './cache/users-cache.service';
import { toUserRecord } from './domain/user-record';
import { UsersMetricsService } from './metrics/users-metrics.service';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersCache: UsersCacheService,
    private readonly usersMetrics: UsersMetricsService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.usersRepository.ensureDefaultUser();
  }

  async getUserBalance(userId: number): Promise<UserBalanceDto> {
    const cached = await this.usersCache.getBalanceSnapshot(userId);

    if (cached) {
      this.usersMetrics.recordBalanceRead('cache_hit');
      return cached;
    }

    this.usersMetrics.recordBalanceRead('cache_miss');

    const userRow = await this.usersRepository.findById(userId);

    if (!userRow) {
      throw new UserNotFoundError(userId);
    }

    const user = toUserRecord(userRow);

    const dto = toUserBalanceDto({
      id: user.id,
      balance: user.balance,
      updatedAt: user.updatedAt,
    });

    await this.usersCache.setBalanceSnapshot(userId, dto);

    return dto;
  }

  async debit(userId: number, amount: number): Promise<UserBalanceDto> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    try {
      const updatedUserRow = await this.usersRepository.debitUserBalance(
        userId,
        amount,
      );
      const updatedUser = toUserRecord(updatedUserRow);

      const dto = toUserBalanceDto({
        id: updatedUser.id,
        balance: updatedUser.balance,
        updatedAt: updatedUser.updatedAt,
      });

      await this.usersCache.setBalanceSnapshot(userId, dto);
      this.usersMetrics.recordDebitSuccess();

      return dto;
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        this.usersMetrics.recordDebitFailure('not_found');
        throw new NotFoundException(error.message);
      }

      if (error instanceof InsufficientBalanceError) {
        this.usersMetrics.recordDebitFailure('insufficient_balance');
        throw new BadRequestException('Insufficient balance');
      }

      this.usersMetrics.recordDebitFailure('unknown');
      throw error;
    }
  }
}
