import { Module } from '@nestjs/common';
import { UsersRepository } from './repositories/users-pg.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersCacheService } from './cache/users-cache.service';
import { UsersMetricsService } from './metrics/users-metrics.service';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    UsersCacheService,
    UsersMetricsService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
