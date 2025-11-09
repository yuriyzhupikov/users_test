import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            getUserBalance: jest.fn(),
            debit: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('returns user balance snapshot', async () => {
    const snapshot = { id: 1, balance: 250, updatedAt: new Date() };
    jest.spyOn(service, 'getUserBalance').mockResolvedValue(snapshot);

    await expect(controller.findOne(1)).resolves.toBe(snapshot);
    expect(service.getUserBalance).toHaveBeenCalledWith(1);
  });

  it('debites balance and returns result', async () => {
    const snapshot = { id: 1, balance: 150, updatedAt: new Date() };
    jest.spyOn(service, 'debit').mockResolvedValue(snapshot);

    await expect(controller.debit(1, { amount: 100 })).resolves.toBe(snapshot);
    expect(service.debit).toHaveBeenCalledWith(1, 100);
  });
});
