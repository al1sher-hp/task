# Учёт оплат — мини-трекер платежей для учебного центра

Backend на Node.js + TypeScript + Express, хранение данных в SQLite через Sequelize,
веб-страница на чистом HTML/CSS/JS (без фреймворков и без сборки фронтенда).

## 1. Требования и запуск с нуля

Требуется **Node.js 18+** (разработано и проверено на Node.js 22).

Скопируйте и выполните команды по порядку — после `npm install` всё остальное
заработает без какой-либо ручной настройки базы данных (SQLite — это просто файл).

```bash
git clone <URL_РЕПОЗИТОРИЯ>
cd task
npm install
cp .env.example .env
npm run seed        # опционально: наполняет БД демо-данными (8 учеников, 2 месяца платежей)
npm run dev         # запуск в режиме разработки (tsx, без сборки)
```

Открыть веб-страницу: http://localhost:3000

Либо для продакшн-режима со сборкой:

```bash
npm run build
npm start
```

Запуск тестов:

```bash
npm test
```

### Переменные окружения (`.env`)

| Переменная | Назначение | Пример |
|---|---|---|
| `PORT` | порт HTTP-сервера | `3000` |
| `DB_PATH` | путь к файлу SQLite | `./data/database.sqlite` |

БД изолирована в `src/db/sequelize.ts`: вся специфика SQLite (диалект, путь к файлу)
находится только в этом файле. Переход на PostgreSQL — это замена одной конфигурации
Sequelize (`dialect: "postgres"` + строка подключения вместо `storage`), остальной код
(модели, сервисы, роуты) не меняется.

### Скрипты npm

| Скрипт | Назначение |
|---|---|
| `npm run dev` | запуск сервера в режиме разработки (tsx, автоперезапуск) |
| `npm run build` | компиляция TypeScript в `dist/` |
| `npm start` | запуск собранного сервера из `dist/` (после `npm run build`) |
| `npm test` | прогон тестов (vitest + supertest, in-memory SQLite) |
| `npm run seed` | наполнение БД демо-данными (сбрасывает текущие таблицы) |

## 2. API

Формат ошибок всегда одинаковый: `{ "error": "сообщение" }`.
`400` — ошибка валидации, `404` — ученик не найден, `500` — непредвиденная ошибка
сервера (стек-трейс никогда не возвращается клиенту).

Деньги хранятся и возвращаются как целые числа (so'm), без дробных значений.

### POST /students — создать ученика

```bash
curl -X POST http://localhost:3000/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Aziz Karimov","phone":"+998901234567","group":"Math-101","monthlyFee":500000}'
```

### GET /students — список учеников

```bash
curl http://localhost:3000/students
curl "http://localhost:3000/students?group=Math-101"   # опциональный фильтр по группе
```

### GET /students/:id — получить одного ученика

```bash
curl http://localhost:3000/students/1
```

### PUT /students/:id и PATCH /students/:id — обновить ученика (частичное обновление)

```bash
curl -X PATCH http://localhost:3000/students/1 \
  -H "Content-Type: application/json" \
  -d '{"monthlyFee":550000}'
```

### DELETE /students/:id — удалить ученика

Удаление ученика каскадно удаляет все его платежи (см. раздел «Допущения»).

```bash
curl -X DELETE http://localhost:3000/students/1
```

### POST /payments — добавить платёж

Поле `date` необязательно — по умолчанию берётся сегодняшняя дата по времени
Asia/Tashkent.

```bash
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{"studentId":1,"amount":500000,"date":"2026-10-05"}'
```

### GET /students/:id/payments — платежи одного ученика (сортировка по дате, убывание)

```bash
curl http://localhost:3000/students/1/payments
```

### GET /debtors?month=YYYY-MM — должники за месяц

`month` обязателен и строго проверяется форматом `YYYY-MM` (месяц 01–12).

```bash
curl "http://localhost:3000/debtors?month=2026-10"
```

Пример ответа:

```json
[
  {
    "studentId": 3,
    "name": "Javlon Rashidov",
    "phone": "+998933456789",
    "group": "Math-101",
    "monthlyFee": 550000,
    "paid": 0,
    "debt": 550000
  }
]
```

Некорректный месяц:

```bash
curl "http://localhost:3000/debtors?month=2026-13"
# => 400 {"error":"month must be in YYYY-MM format with a valid month 01-12"}
```

## 3. Допущения

- **Каскадное удаление платежей.** При удалении ученика (`DELETE /students/:id`)
  все его платежи удаляются безвозвратно (`src/services/studentsService.ts`).
  История платежей удалённого ученика не хранится для аудита — это сознательное
  упрощение для тестового задания (см. раздел 5).
- **Переплата не переносится на другие месяцы.** Если ученик заплатил больше
  `monthlyFee` в одном месяце, остаток не уменьшает долг в следующем или предыдущем
  месяце — долг считается независимо для каждого месяца.
- **Ученики, созданные после окончания запрошенного месяца, исключаются из
  должников** — считается, что их ещё не существовало в этом месяце
  (`src/services/debtorsService.ts`, сравнение даты создания с концом месяца).
- **Деньги — целые числа (so'm).** Поля `monthlyFee` и `amount` — целые положительные
  числа, дробные значения (float) не используются, чтобы избежать ошибок округления.
- **Текущий месяц/дата везде считается по таймзоне Asia/Tashkent** (`src/utils/date.ts`),
  независимо от таймзоны сервера или браузера клиента.
- **Телефон** проверяется по упрощённому формату `+998XXXXXXXXX` (код страны + 9 цифр).
- **Удаление ученика** — полное (hard delete), без soft-delete/архивации.

## 4. Соответствие заданию

### Часть 1 — API

| Требование | Где реализовано |
|---|---|
| Student: id, name, phone, group, monthlyFee, createdAt, updatedAt | `src/models/Student.ts` |
| Payment: id, studentId (FK), amount, date, createdAt | `src/models/Payment.ts` |
| Деньги как INTEGER, без float | `src/models/Student.ts`, `src/models/Payment.ts` |
| POST /students | `src/routes/students.ts` |
| GET /students (+ фильтр по group) | `src/routes/students.ts`, `src/services/studentsService.ts` |
| GET /students/:id | `src/routes/students.ts` |
| PUT/PATCH /students/:id (частичное обновление) | `src/routes/students.ts`, `src/services/studentsService.ts` |
| DELETE /students/:id (каскад платежей) | `src/services/studentsService.ts` |
| POST /payments | `src/routes/payments.ts` |
| GET /students/:id/payments (сортировка по дате desc) | `src/services/paymentsService.ts` |
| GET /debtors?month=YYYY-MM | `src/routes/debtors.ts` |
| Логика должников: paid = SUM по месяцу, debt = fee - paid, debt > 0 | `src/services/debtorsService.ts` |
| Студенты без платежей — тоже должники (LEFT JOIN + COALESCE) | `src/services/debtorsService.ts` |
| Переплата не переносится между месяцами | `src/services/debtorsService.ts` (документировано там же) |
| Исключение студентов, созданных после месяца | `src/services/debtorsService.ts` |
| Ответ /debtors: сортировка по debt desc | `src/services/debtorsService.ts` |
| Валидация month: строгий YYYY-MM + 01-12, 400 при ошибке | `src/utils/validation.ts` (`monthQuerySchema`) |
| Агрегация в SQL, а не в памяти | `src/services/debtorsService.ts` (SUM в SQL-запросе через `sequelize.query`) |
| "Текущий месяц" — таймзона Asia/Tashkent | `src/utils/date.ts` |
| Единый формат ошибок `{ "error": ... }` | `src/middleware/errorHandler.ts` |
| 400 / 404 / 500 без утечки стек-трейса | `src/middleware/errorHandler.ts`, `src/utils/errors.ts` |
| POST /payments с несуществующим studentId → 404 | `src/services/paymentsService.ts` |
| Валидация входных данных (zod) | `src/utils/validation.ts` |

### Часть 2 — веб-страница

| Требование | Где реализовано |
|---|---|
| Статика отдаётся тем же Express-сервером с GET / | `src/app.ts` (`express.static`), `public/` |
| Мобильная вёрстка, viewport, без горизонтального скролла на 360px | `public/index.html`, `public/style.css` |
| Список должников за выбранный месяц, месяц по умолчанию — текущий (Asia/Tashkent) | `public/app.js` (`currentMonthInTashkent`) |
| Показ имени, группы, телефона, оплачено, ежемесячный платёж, долг | `public/app.js` (`renderDebtors`) |
| Общая сумма долга | `public/app.js` (`debtorsTotal`) |
| Пустое состояние при отсутствии должников | `public/app.js` (`empty-state`) |
| Форма добавления платежа (выбор ученика, сумма, дата по умолчанию — сегодня) | `public/index.html`, `public/app.js` |
| Успех: подтверждение, сброс формы, обновление списка должников | `public/app.js` (`handlePaymentSubmit`) |
| Ошибка: показ сообщения от API | `public/app.js` (`handlePaymentSubmit`, `apiFetch`) |
| Суммы с разделителем тысяч ("450 000 so'm") | `public/app.js` (`formatMoney`) |
| Экранирование пользовательских данных (без innerHTML с данными) | `public/app.js` (везде `textContent`, `innerHTML` используется только для очистки контейнера) |

### Часть 3 — README

Этот файл: требования и запуск (раздел 1), API-референс с curl (раздел 2),
допущения (раздел 3), это соответствие заданию (раздел 4), планы на будущее (раздел 5).

### Гигиена проекта

| Требование | Где реализовано |
|---|---|
| Структура src/routes, src/services, src/models, src/db, public/, tests/ | корень репозитория |
| Логика должников — в сервисе, не в роуте | `src/services/debtorsService.ts` |
| Скрипты dev/build/start/test/seed | `package.json` |
| `npm start` работает после `npm install` + `npm run build` | `package.json`, `src/server.ts` |
| `.env.example` с PORT и путём к БД | `.env.example` |
| `.gitignore` (node_modules, .env, sqlite-файл, dist) | `.gitignore` |
| Seed: ~8 учеников, 2-3 группы, платежи за текущий и предыдущий месяц | `src/db/seed.ts` |
| Тесты: должники (без платежей, частично, точно, переплата, другой месяц, созданы позже, невалидный месяц → 400), CRUD + 404, платёж неизвестному ученику → 404, валидация → 400 | `tests/debtors.test.ts`, `tests/students.test.ts`, `tests/payments.test.ts` |
| Каждый тест — на свежей in-memory SQLite | `vitest.config.ts` (`DB_PATH=":memory:"`), `tests/setupDb.ts` (`sequelize.sync({force:true})` перед каждым тестом) |

## 5. Что бы я улучшил за неделю

1. **Авторизация и роли** — сейчас API полностью открыт; добавил бы JWT-аутентификацию
   и разделение ролей (администратор / преподаватель).
2. **Мягкое удаление и аудит платежей** — вместо каскадного удаления хранить
   удалённых учеников и их платежи с пометкой `deletedAt`, чтобы не терять финансовую
   историю.
3. **Перенос переплаты между месяцами** — опциональная настройка, позволяющая
   засчитывать переплату прошлого месяца в счёт следующего.
4. **PostgreSQL + миграции + Docker** — `docker-compose.yml` с PostgreSQL и
   `sequelize-cli`-миграциями вместо `sequelize.sync()`, для безопасного продакшна.
5. **Пагинация и Telegram-бот** — пагинация для GET /students и GET /debtors при
   росте базы учеников, плюс Telegram-бот на том же API для уведомлений должникам.
