import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { UserBalanceDto } from '../dto/user-balance.dto';
import { appConfig } from '../../configuretion/config';

@Injectable()
export class UsersCacheService {
  constructor(
    private readonly redisService: RedisService, 
    @Inject(appConfig.KEY) private readonly appConfig_: ConfigType<typeof appConfig>
  ) {}

  async getBalanceSnapshot(userId: number): Promise<UserBalanceDto | null> {
    return this.redisService.get<UserBalanceDto>(this.cacheKey(userId));
  }

  async setBalanceSnapshot(userId: number, snapshot: UserBalanceDto): Promise<void> {
    await this.redisService.set(this.cacheKey(userId), snapshot, this.appConfig_.cacheTtlSeconds);
  }

  private cacheKey(userId: number): string {
    return `user:${userId}`;
  }
}
