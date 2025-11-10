import { ApiProperty } from '@nestjs/swagger';

export class UserBalanceDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 250.5 })
  balance!: number;

  @ApiProperty({ example: '2025-01-01T12:00:00.000Z' })
  updatedAt!: Date;
}

export const toUserBalanceDto = (input: {
  id: number;
  balance: number;
  updatedAt: Date;
}): UserBalanceDto => ({ ...input });
