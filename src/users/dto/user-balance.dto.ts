export class UserBalanceDto {
  id!: number;
  balance!: number;
  updatedAt!: Date;
}

export const toUserBalanceDto = (input: {
  id: number;
  balance: number;
  updatedAt: Date;
}): UserBalanceDto => ({ ...input });
