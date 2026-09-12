# URL Shortener

Сервис для сокращения ссылок с базовой аналитикой переходов.

## Технологии

| Слой | Стек |
|------|------|
| Backend | Node.js, Express, TypeScript |
| База данных | PostgreSQL |
| Кеш | Redis (TTL 1 час) |
| Frontend | React, TypeScript, Vite |
| Контейнеризация | Docker, Docker Compose |
| Тесты | Jest, Supertest |
| Логирование | Morgan |
| Валидация | Zod |

## Структура проекта

```
.
├── backend/
│   └── src/
│       ├── config/        # подключение PostgreSQL и Redis
│       ├── types/         # интерфейсы и AppError
│       ├── repositories/  # SQL-запросы к БД
│       ├── services/      # бизнес-логика, кеширование
│       ├── controllers/   # обработчики Express
│       ├── middleware/     # валидация Zod, обработка ошибок
│       ├── routes/        # маршруты
│       └── utils/         # генератор коротких кодов
├── frontend/
│   └── src/
│       ├── api/           # fetch-клиент
│       └── components/    # ShortenForm, StatsForm
├── docker-compose.yml
└── .env.example
```

## Переменные окружения

Скопируйте `.env.example` и заполните по необходимости:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=urlshortener
DB_USER=postgres
DB_PASSWORD=postgres
REDIS_URL=redis://localhost:6379
PORT=4000
BASE_URL=http://localhost:4000
```

## Запуск через Docker (рекомендуется)

```bash
git clone https://github.com/TannoRanevuvc/URL-Shortener.git
cd URL-Shortener

cp .env.example .env   # при необходимости отредактируйте значения

docker-compose up --build
```

- Фронтенд: http://localhost:3000
- Backend API: http://localhost:4000

## Локальный запуск (без Docker)

### Требования
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Backend

```bash
cd backend
cp .env.example .env   # заполните реальные значения
npm install
npm run dev            # сервер на http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # UI на http://localhost:5173
```

## API

### POST /api/shorten — создать короткую ссылку

```bash
curl -X POST http://localhost:4000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://example.com/very/long/path"}'
```

Ответ `201`:
```json
{
  "shortCode": "aB3xYz",
  "shortUrl": "http://localhost:4000/aB3xYz"
}
```

---

### GET /:shortCode — редирект на оригинальный URL

```bash
curl -L http://localhost:4000/aB3xYz
# HTTP 302 → переходит на https://example.com/very/long/path
```

---

### GET /api/stats/:shortCode — статистика переходов

```bash
curl http://localhost:4000/api/stats/aB3xYz
```

Ответ `200`:
```json
{
  "originalUrl": "https://example.com/very/long/path",
  "shortCode": "aB3xYz",
  "clicks": 5,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

---

### Коды ошибок

| Код | Причина |
|-----|---------|
| 400 | Невалидный или не HTTP/HTTPS URL |
| 400 | Циклический редирект (ссылка указывает на этот сервис) |
| 404 | Короткий код не найден |
| 500 | Не удалось сгенерировать уникальный код |

## Дополнительные возможности (сверх ТЗ)

### Мои ссылки
При первом открытии сайта браузер получает анонимный UUID, который сохраняется в `localStorage`. Этот идентификатор передаётся при каждом сокращении ссылки и записывается в БД (`user_id` в таблице `urls`). Благодаря этому:
- в разделе **«Мои ссылки»** отображаются только ссылки, созданные с этого устройства/браузера
- данные хранятся на сервере, а не в `localStorage` — ссылки не теряются при обновлении страницы и видны до тех пор, пока не сменился UUID
- список автоматически обновляется после каждого нового сокращения

Новый эндпоинт: `GET /api/links/:userId`

---

### Уникальные переходы
Помимо общего счётчика кликов (`clicks`) отслеживаются уникальные переходы (`unique_clicks`) — по одному на каждый IP-адрес.

**Как работает:**
1. При переходе по короткой ссылке выполняется `SADD visits:{shortCode} {IP}` в Redis
2. Если IP встречается впервые — Redis возвращает `1`, и счётчик `unique_clicks` в PostgreSQL увеличивается
3. При повторных переходах с того же IP растёт только `clicks`

Оба счётчика отображаются в разделах **Статистика** и **Мои ссылки**.

---

## Тесты

```bash
cd backend
npm test
```

Покрыты все три эндпоинта: создание, редирект, статистика, а также граничные случаи (невалидный URL, несуществующий код, счётчик кликов).

## Кеширование

При первом переходе по короткой ссылке оригинальный URL читается из PostgreSQL и сохраняется в Redis с TTL 1 час.  
При повторных запросах URL отдаётся из Redis — обращения к БД нет (видно в логах Morgan: отсутствие SQL-запроса).
