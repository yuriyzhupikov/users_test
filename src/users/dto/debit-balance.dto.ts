import { Transform } from 'class-transformer';
import { IsNumber, IsPositive } from 'class-validator';

export class DebitBalanceDto {
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsNumber()
  @IsPositive()
  amount!: number;
}
