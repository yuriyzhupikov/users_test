import { Selectable } from 'kysely';
import { UsersTable } from '../../datebase/database.types';

export interface UserRecord {
  id: number;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export const toUserRecord = (row: Selectable<UsersTable>): UserRecord => ({
  id: row.id,
  balance: Number(row.balance) || 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
