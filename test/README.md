# Как запустить приложение

1. Установить зависимости: `npm install`
2. Запуск e2e теста: npm run test:e2e -- --runInBand
2. Поднять инфраструктуру: `docker compose up -d postgres redis`
3. Стартовать сервис: `npm run start:dev`

После этого API доступен на `http://localhost:3000`.

