## web server

### Быстрый запуск
```bash
cp .env.example .env
npm run start:infra
npm install
npm run db:migrate
npm run start:dev
```
Сервис доступен по `http://localhost:3000`, метрики Prometheus — на `/metrics`.

### Переменные окружения
- `PORT` — порт HTTP сервера (по умолчанию 3000)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_POOL_MAX`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`
- `CACHE_TTL` — время жизни кеша баланса, секунды

## Модель данных

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
- Баланс пересчитывается из таблицы `payment_history` после каждого списания.
- `CREDIT` — приход средств, `DEBIT` — расход.

## API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/users/:id` | Возвращает кешированный снимок баланса пользователя. |
| `POST` | `/users/:id/debit` | `{ "amount": number }`. Записывает списание, пересчитывает баланс и возвращает новый снимок. |
| `GET` | `/metrics` | Prometheus-метрики (`user_balance_reads_total`, `user_debit_requests_total` и системные). |

Валидация включена глобально; некорректные ID/amount → ответы `400/404`.

### Пример

```bash
curl -X POST http://localhost:3000/users/1/debit \
  -H 'Content-Type: application/json' \
  -d '{"amount": 100}'
```

При наличии `$100` создаётся запись в `payment_history`, баланс пересчитывается и кеш обновляется.

## Примечания

- Volume `postgres_data` хранит данные Postgres между рестартами.
- `docker compose down -v` полностью очищает БД.
- Пополнение баланса выполняется вставкой записи `action='CREDIT'` в `payment_history`.
