### Быстрый запуск
1. Создать базу данных
2. Выполнить команды:
```bash
cp .env.example .env
npm ci
npm run start:infra
npm run db:migrate
npm run start:dev
```

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

## API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/users/:id` | Возвращает кешированный снимок баланса пользователя. |
| `POST` | `/users/:id/debit` | `{ "amount": number }`. Записывает списание, пересчитывает баланс и возвращает новый снимок. |
| `GET` | `/metrics` | Prometheus-метрики (`user_balance_reads_total`, `user_debit_requests_total` и системные). |

Валидация включена глобально; некорректные ID/amount - ответы `400/404`.

### Пример

```bash
curl -X POST http://localhost:3000/users/1/debit \
  -H 'Content-Type: application/json' \
  -d '{"amount": 100}'
```

При наличии `$100` создаётся запись в `payment_history`, баланс пересчитывается и кеш обновляется.