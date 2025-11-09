## Ledger web server

NestJS service for maintaining a user's balance in PostgreSQL using a simple ledger (history of credit/debit operations). The `/users/:id/debit` endpoint records a debit operation and recalculates the running balance directly from the history table after every change.

### Stack

- NestJS 11 + Kysely (PostgreSQL) with explicit repository layer
- Docker Compose for Postgres 16
- Redis-backed cache with metrics via Prometheus-compatible endpoint
- Class-validator for DTO validation

## Getting started

```bash
cp .env.example .env
docker compose up -d postgres redis
npm install
npm run start:dev
```

The API listens on the port configured by `PORT` (defaults to `3000`). Update the `.env` file if you change the Postgres credentials/port inside `docker-compose.yml`.

## Database model

```
users
  id          serial primary key
  balance     numeric(12,2)
  created_at  timestamptz
  updated_at  timestamptz

payment_history
  id      serial primary key
  user_id references users(id)
  action  CREDIT|DEBIT
  amount  numeric(12,2)
  ts      timestamptz
```

- A system user with `id=1` is created automatically on startup (if missing).
- Balances are recalculated from the `payment_history` table after every debit to ensure consistency.
- `CREDIT` rows are treated as positive cash flow, `DEBIT` as negative.

All SQL lives inside `UsersRepository` (`src/users/repositories/users.repository.ts`), so the service layer only coordinates validation/caching logic. A lightweight `DatabaseModule` wires Kysely to Postgres and ensures the schema exists on startup.

## API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/users/:id` | Returns the cached balance snapshot for the user. |
| `POST` | `/users/:id/debit` | Body: `{ "amount": number }`. Records a debit, recalculates the balance from history, and returns the updated snapshot. |
| `GET` | `/metrics` | Exposes Prometheus metrics (`user_balance_reads_total`, `user_debit_requests_total`, default process metrics). |

Validation is enabled globally. Requests with invalid IDs or amounts fail with `400`/`404`.

### Example

```bash
curl -X POST http://localhost:3000/users/1/debit \
  -H 'Content-Type: application/json' \
  -d '{"amount": 100}'
```

If the user has at least `$100` available, the service stores a new `payment_history` row, recomputes the running total, updates `users.balance`, invalidates the cache entry, and returns the new balance.

## Notes

- Docker volume `postgres_data` keeps your database between restarts.
- Run `docker compose down -v` to reset Postgres.
- For credits/top-ups, insert `payment_history` rows with `action='CREDIT'`; the service will pick them up on the next debit or manual recalculation.
