import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DebitBalanceDto } from './dto/debit-balance.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Актуальный баланс пользователя' })
  @ApiNotFoundResponse({ description: 'Пользователь не найден' })
  getUserBalance(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserBalance(id);
  }

  @Post(':id/debit')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Баланс успешно списан' })
  @ApiBadRequestResponse({
    description: 'Некорректные данные или недостаточно средств',
  })
  @ApiNotFoundResponse({ description: 'Пользователь не найден' })
  debit(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: DebitBalanceDto,
  ) {
    return this.usersService.debit(id, payload.amount);
  }
}
