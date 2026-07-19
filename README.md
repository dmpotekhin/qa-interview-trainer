# QA Interview Trainer

Полнофункциональный локальный веб-тренажёр для подготовки к собеседованию на позицию **QA Automation (Java)**. Содержит SQL-тренажёр с живой БД, API-кейсы с мок-сервером, Java live-coding задачи, карточки Java Core и QA-вопросов, архитектурные схемы.

## Архитектура

```
┌──────────┐     ┌──────────────┐     ┌──────────┐
│  Browser │────▶│ Frontend     │────▶│ Backend  │
│ :3000    │     │ Vite + React │     │ FastAPI  │
└──────────┘     └──────────────┘     └────┬─────┘
                                           │
                          ┌────────────────┼────────────────┐
                          ▼                ▼                ▼
                   ┌──────────┐    ┌──────────┐    ┌──────────┐
                   │PostgreSQL│    │ JSON     │    │ Mock API │
                   │   :5432  │    │  banks   │    │  :8080   │
                   └──────────┘    └──────────┘    └──────────┘
```

## Состав

| Сервис | Порт | Технология | Назначение |
|--------|------|-----------|-----------|
| Frontend | 3000 | Vite + React + Tailwind | SPA-интерфейс тренажёра |
| Backend | 8000 | FastAPI + psycopg2 | REST API, проверка SQL |
| Mock API | 8080 | FastAPI | Мок банковского API с багом округления |
| PostgreSQL | 5432 | PostgreSQL 16 | Живая БД с подсаженными багами |

## Быстрый старт

### Предварительные требования

- Python 3.11+
- Node.js 20+
- PostgreSQL 16 (или 14)
- bash

### 1. База данных

```bash
# Создать пользователя и БД
psql -h 127.0.0.1 -U postgres -d postgres
> CREATE USER trainer WITH PASSWORD 'trainer';
> CREATE DATABASE trainer OWNER trainer;
> GRANT ALL PRIVILEGES ON DATABASE trainer TO trainer;

# Применить схему и данные
psql -h 127.0.0.1 -U trainer -d trainer -f db/01_schema.sql
psql -h 127.0.0.1 -U trainer -d trainer -f db/02_seed.sql
```

### 2. Запуск одним скриптом

```bash
bash start.sh
```

### 3. Или вручную (три терминала)

```bash
# Терминал 1 — backend
cd backend
DB_HOST=localhost DB_PORT=5432 DB_NAME=trainer DB_USER=trainer DB_PASSWORD=trainer \
  python3 -m uvicorn main:app --host 0.0.0.0 --port 8000

# Терминал 2 — mock API
cd mock-api
python3 mock_server.py

# Терминал 3 — frontend
cd frontend
npm install
VITE_API_URL=http://localhost:8000 VITE_MOCK_URL=http://localhost:8080 \
  npx vite --host 0.0.0.0 --port 3000
```

### 4. Открыть в браузере

```
http://localhost:3000
```

## Разделы тренажёра

### 🏠 Дашборд
- Вопрос дня (из банка QA-вопросов)
- Прогресс по разделам

### 🗄️ SQL-тренажёр
- **22 задачи** от easy до hard
- Живая PostgreSQL с двумя схемами: `ecommerce` и `banking`
- **Схема БД** — раскрывающаяся панель со всеми таблицами и колонками
- **Подсказка** к каждой задаче: таблицы, связи PK/FK, подход, типичные ошибки
- CodeMirror-редактор с подсветкой SQL
- Автоматическая проверка: сравнение результата с эталоном
- **Эталонный ответ** — раскрывается после проверки

#### Схема ecommerce
```
client              address             shipping_type       product
─────────────────   ─────────────────   ─────────────────   ─────────────
id BIGINT PK        id BIGINT PK        id BIGINT PK        id BIGINT PK
name VARCHAR         client_id FK        type VARCHAR         name VARCHAR
email VARCHAR        country VARCHAR                          price NUMERIC
                     city VARCHAR        "order"
"order"              street VARCHAR      ─────────────────   order_product
─────────────────    zip_code INTEGER    id BIGINT PK        ─────────────
id BIGINT PK         house VARCHAR        client_id FK        order_id FK
client_id FK         flat INTEGER         shipping_type_id FK product_id FK
shipping_type_id FK                       shipping_addr_id FK count INTEGER
shipping_addr_id FK                       sum NUMERIC          price NUMERIC
sum NUMERIC                               shipping_price NUM
shipping_price NUM                        shipping_method VARCHAR
shipping_method VARCHAR                   status VARCHAR
status VARCHAR                            created_date DATE
created_date DATE
```

#### Схема banking
```
users                accounts              transactions           outbox_events
─────────────────    ─────────────────     ─────────────────     ─────────────────
id UUID PK           id UUID PK            id UUID PK            id BIGSERIAL PK
email VARCHAR         user_id FK            source_account_id FK  event_type VARCHAR
fullname VARCHAR      account_number VARCHAR destination_acc_id FK payload JSON
status VARCHAR        balance DECIMAL       amount DECIMAL         processed BOOLEAN
created_at TIMESTAMP  currency CHAR(3)      currency CHAR(3)       created_at TIMESTAMP
                      status VARCHAR        status VARCHAR
payment_templates     created_at TIMESTAMP  idempotency_key VARCHAR UK
─────────────────                          failure_reason VARCHAR
id UUID PK                                 created_at TIMESTAMP
user_id FK
template_name VARCHAR
last_amount DECIMAL
created_at TIMESTAMP
```

#### Баги в БД (bug hunting)

| ID | Описание | Где искать |
|----|---------|-----------|
| BUG-1 | order.sum ≠ SUM(count×price) | Заказ #2: 45000.99 vs 45000.00 |
| BUG-2 | Адрес чужого клиента | Заказ #3: адрес Ивана у Алексея |
| BUG-3 | Мусорный статус 'in_progres' | Заказ #4 |
| BUG-4 | PENDING старше 1 часа | Транзакция c0000002 |
| BUG-5 | Перевод самому себе | Транзакция c0000003 |
| BUG-6 | COMPLETED с FROZEN-счёта | Транзакция c0000004 |
| BUG-7 | Несовпадение валют | Транзакция c0000005: EUR с RUB-счёта |
| BUG-8 | Дубль idempotency_key + упавший outbox | key-DUP, событие e0000002 |
| BUG-9 | Пользователь без счёта | Ольга Смирнова (44444444...) |
| BUG-10 | Клиент без заказов | Дмитрий Новиков (id=5) |

### 🔌 API-кейсы
- POST `/api/v1/transfers/internal` с мок-сервером
- **Баг округления**: amount=1500.50 → ответ 1500.00
- Поля как в реальном API: `source_account_id`, `destination_account_id`, `description`
- Заголовки: `Idempotency-Key`, `Authorization: Bearer`

### ☕ Java live-coding
- 8 задач (JLC-01..JLC-08): строки, коллекции, стримы, многопоточность
- Каждая с сигнатурой метода и тест-кейсами
- Раскрывающееся решение на Java 17

### 📚 Java Core
- 117 вопросов по темам: ООП, коллекции, многопоточность, JVM, Generics, String, исключения, Java 8
- Фильтры по теме и уровню (Junior/Middle/Senior)
- Карточки с вопросом/ответом, навигация и случайный выбор

### ✅ QA-вопросы
- 202 вопроса: тестирование, автоматизация, API/HTTP, SQL/БД, банковский домен, soft skills
- Та же механика карточек с фильтрами

### 🏗️ Архитектура
- Цепочка внутреннего перевода: **User → API Gateway → Redis → Transfer Service → PostgreSQL → Kafka → ClickHouse → Kibana**
- 7 шагов с пояснением каждого этапа

## Структура проекта

```
qa-interview-trainer/
├── start.sh                    # Скрипт запуска всех сервисов
├── backend/
│   ├── main.py                 # FastAPI: эндпоинты, проверка SQL, прогресс
│   ├── requirements.txt        # fastapi, uvicorn, psycopg2-binary, pydantic
│   ├── Dockerfile
│   └── data/
│       ├── sql_question_bank.json    # 22 SQL-задачи + теория + API-кейсы
│       ├── java_trainer_bank.json    # 8 live-coding задач
│       ├── java_core_questions.json  # 117 вопросов Java Core
│       └── qa_questions.json         # 202 вопроса QA
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Роутинг SPA
│   │   ├── api.js              # Axios-клиент к backend
│   │   └── pages/
│   │       ├── Dashboard.jsx   # Дашборд с вопросом дня
│   │       ├── SqlTrainer.jsx  # SQL-тренажёр с CodeMirror
│   │       ├── ApiCases.jsx    # API-кейсы с мок-сервером
│   │       ├── JavaTrainer.jsx # Java live-coding
│   │       ├── Flashcards.jsx  # Карточки (Java Core + QA)
│   │       └── Architecture.jsx# Архитектурная схема
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── mock-api/
│   ├── mock_server.py          # Мок банковского API
│   └── mappings/
│       └── transfer_internal.json  # WireMock-маппинг (опционально)
├── db/
│   ├── 01_schema.sql           # DDL: ecommerce + banking
│   └── 02_seed.sql             # Тестовые данные с багами
└── docs/
    └── interview-images/       # Скриншоты схемы БД и API
```

## API эндпоинты

| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/health` | Проверка: backend + БД |
| GET | `/api/sql` | Банк SQL-задач |
| POST | `/api/sql/check` | Проверка SQL-запроса |
| GET | `/api/java-trainer` | Задачи Java live-coding |
| GET | `/api/java-core` | Вопросы Java Core |
| GET | `/api/qa` | QA-вопросы |
| GET | `/api/question-of-the-day` | Случайный вопрос дня |
| GET | `/api/progress/{user_id}` | Статистика прогресса |
| POST | `/api/progress` | Сохранить прогресс |

## Лицензия

MIT
