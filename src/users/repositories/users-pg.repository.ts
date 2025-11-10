import { Inject, Injectable } from '@nestjs/common';
import { Kysely, Selectable, Transaction, sql } from 'kysely';
import { DatabaseSchema, UsersTable } from '../../datebase/database.types';
import { PaymentAction } from '../enum/payment-action.enum';
import {
  InsufficientBalanceError,
  UserNotFoundError,
} from '../errors/user-domain.errors';
import { PG_CLIENT } from '../../configuretion/constants';

type DbExecutor = Kysely<DatabaseSchema> | Transaction<DatabaseSchema>;

@Injectable()
export class UsersRepository {
  constructor(
    @Inject(PG_CLIENT) private readonly pgClient: Kysely<DatabaseSchema>,
  ) {}

  async ensureDefaultUser(): Promise<void> {
    await this.pgClient
      .insertInto('users')
      .values({ id: 1, balance: 0 })
      .onConflict((oc) => oc.column('id').doNothing())
      .execute();
  }

  async findById(userId: number): Promise<Selectable<UsersTable> | undefined> {
    const row = await this.pgClient
      .selectFrom('users')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirst();

    return row;
  }

  async debitUserBalance(
    userId: number,
    amount: number,
  ): Promise<Selectable<UsersTable>> {
    const updatedRow = await this.pgClient
      .transaction()
      .execute(async (trx) => {
        const user = await trx
          .selectFrom('users')
          .selectAll()
          .where('id', '=', userId)
          .forUpdate()
          .executeTakeFirst();

        if (!user) {
          throw new UserNotFoundError(userId);
        }

        const currentBalance = Number(user.balance) || 0;

        if (currentBalance < amount) {
          throw new InsufficientBalanceError(userId);
        }

        await trx
          .insertInto('payment_history')
          .values({
            user_id: userId,
            action: PaymentAction.DEBIT,
            amount,
          })
          .execute();

        const newBalance = await this.calculateBalance(trx, userId);

        const updated = await trx
          .updateTable('users')
          .set({
            balance: newBalance,
            updated_at: sql`now()`,
          })
          .where('id', '=', userId)
          .returningAll()
          .executeTakeFirstOrThrow();

        return updated;
      });

    return updatedRow;
  }

  private async calculateBalance(
    executor: DbExecutor,
    userId: number,
  ): Promise<number> {
    const result = await executor
      .selectFrom('payment_history')
      .select(
        sql<number>`COALESCE(SUM(CASE WHEN action = 'CREDIT' THEN amount ELSE -amount END), 0)`.as(
          'balance',
        ),
      )
      .where('user_id', '=', userId)
      .executeTakeFirst();

    return Number(result?.balance) || 0;
  }
}
