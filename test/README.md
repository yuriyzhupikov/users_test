# Как запустить приложение

1. `npm install`
2. `docker compose up -d postgres redis`
3. `npm run db:migrate`
4. `npm run start:dev`

# E2E-тесты

В каталоге лежит сквозной тест пользовательского баланса. Он использует Fastify-адаптер и in-memory замены БД/кэша, поэтому внешний Postgres/Redis не нужны.

## Как запустить тесты

```bash
npm install
npm run test:e2e -- --runInBand
```

Флаг `--runInBand` помогает избежать падений Jest в ограниченных окружениях.
