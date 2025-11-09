export class UserNotFoundError extends Error {
  constructor(userId: number) {
    super(`User ${userId} not found`);
  }
}

export class InsufficientBalanceError extends Error {
  constructor(userId: number) {
    super(`User ${userId} has insufficient balance`);
  }
}
