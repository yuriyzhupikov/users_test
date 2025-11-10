import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { DebitBalanceDto } from './dto/debit-balance.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserBalance(id);
  }

  @Post(':id/debit')
  debit(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: DebitBalanceDto,
  ) {
    return this.usersService.debit(id, payload.amount);
  }
}
