import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsPositive } from 'class-validator';

export class DebitBalanceDto {
  @ApiProperty({ example: 100, description: 'Сумма списания' })
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsNumber()
  @IsPositive()
  amount!: number;
}
