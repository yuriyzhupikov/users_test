import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { DatabaseSchema } from './database.types';
import { KYSELY_DB } from '../configuretion/constants';
import { databaseConfig } from '../configuretion/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: KYSELY_DB,
      inject: [databaseConfig.KEY],
      useFactory: (databaseConfig_: ConfigType<typeof databaseConfig>) => 
        new Kysely<DatabaseSchema>({
          dialect: new PostgresDialect({
            pool: new Pool({
              ...databaseConfig_
            }),
          }),
        })
    }
  ],
  exports: [KYSELY_DB],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<DatabaseSchema>) {}

  async onModuleDestroy(): Promise<void> {
    await this.db.destroy();
  }
}
