import { Module } from '@nestjs/common';
import { DatabaseModule } from '../datebase/database.module';
import { UsersRepository } from './repositories/users-pg.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersCacheService } from './cache/users-cache.service';
import { PrometheusModule } from '../prometheus/prometheus.module';
import { UsersMetricsService } from './metrics/users-metrics.service';

@Module({
  imports: [DatabaseModule, PrometheusModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, UsersCacheService, UsersMetricsService],
  exports: [UsersService],
})
export class UsersModule {}
