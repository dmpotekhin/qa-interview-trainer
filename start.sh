#!/usr/bin/env bash
# =========================================
# QA Interview Trainer — запуск всех сервисов
# =========================================
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
echo ">>> QA Interview Trainer — запуск из $ROOT"

# 1. Проверить PostgreSQL
echo -n ">>> PostgreSQL... "
if pg_isready -h 127.0.0.1 -p 5432 -q 2>/dev/null; then
  echo "OK (порт 5432)"
else
  echo "НЕ ЗАПУЩЕН! Запусти PostgreSQL 16: brew services start postgresql@14"
  echo "   или: pg_ctl -D /Library/PostgreSQL/16/data start"
  exit 1
fi

# 2. Backend
echo -n ">>> Backend... "
lsof -ti:8000 | xargs kill 2>/dev/null || true
cd "$ROOT/backend"
DB_HOST=localhost DB_PORT=5432 DB_NAME=trainer DB_USER=trainer DB_PASSWORD=trainer \
  nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/trainer-backend.log 2>&1 &
echo "pid $! (порт 8000)"

# 3. Mock API
echo -n ">>> Mock API... "
lsof -ti:8080 | xargs kill 2>/dev/null || true
cd "$ROOT/mock-api"
nohup python3 mock_server.py > /tmp/trainer-mock.log 2>&1 &
echo "pid $! (порт 8080)"

# 4. Frontend
echo -n ">>> Frontend... "
lsof -ti:3000 | xargs kill 2>/dev/null || true
cd "$ROOT/frontend"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
VITE_API_URL=http://localhost:8000 VITE_MOCK_URL=http://localhost:8080 \
  nohup npx vite --host 0.0.0.0 --port 3000 > /tmp/trainer-frontend.log 2>&1 &
echo "pid $! (порт 3000)"

# 5. Ждём и проверяем
echo ""
echo ">>> Жду запуска..."
sleep 3

echo -n "  Backend  : " && curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health && echo " OK"
echo -n "  Frontend : " && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 && echo " OK"
echo -n "  Mock API : " && curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8080/api/v1/transfers/internal \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: health' \
  -H 'Authorization: Bearer health' \
  -d '{"amount":1}' && echo " OK"

echo ""
echo "================ ГОТОВО ================"
echo "  Тренажёр : http://localhost:3000"
echo "  Backend  : http://localhost:8000/docs"
echo "  Mock API : http://localhost:8080"
echo "  БД       : psql -h 127.0.0.1 -U trainer -d trainer"
echo "========================================"
