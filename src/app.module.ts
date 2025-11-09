import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './datebase/database.module';
import { UsersModule } from './users/users.module';
import { appConfig, databaseConfig, redisConfig } from './configuretion/config';
import { RedisModule } from './redis/redis.module';
import { PrometheusModule } from './prometheus/prometheus.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig],
    }),
    DatabaseModule,
    RedisModule,
    PrometheusModule,
    UsersModule,
  ],
})
export class AppModule {}
