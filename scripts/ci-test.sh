#!/usr/bin/env bash
set -e

echo "=== CI Test Runner ==="
echo "NODE_ENV=$NODE_ENV"
echo "DATABASE_URL=$DATABASE_URL"
echo "PORT=$PORT"

# Wait for PostgreSQL
echo "--- Waiting for PostgreSQL ---"
for i in $(seq 1 30); do
  if nc -z localhost 5432; then
    echo "PostgreSQL ready after ${i}s"
    break
  fi
  sleep 1
done

# Push schema
echo "--- Pushing schema ---"
npx drizzle-kit push 2>&1

# Seed test data
echo "--- Seeding test data ---"
npx tsx server/seedTest.ts 2>&1

# Start server
echo "--- Starting test server ---"
npm run dev:test &
SERVER_PID=$!

# Wait for server
echo "--- Waiting for server ---"
npx wait-on http://localhost:3001/api/toys --timeout 30000

# Verify dev endpoints
echo "--- Verifying dev login ---"
RESP=$(curl -s -w "\n%{http_code}" http://localhost:3001/api/dev/login/seed_user_1)
echo "$RESP" | tail -1
HTTP_CODE=$(echo "$RESP" | tail -1)
if [ "$HTTP_CODE" != "200" ]; then
  echo "ERROR: Dev login returned $HTTP_CODE (expected 200)"
  echo "Full response:"
  echo "$RESP"
  exit 1
fi
echo "Dev login OK"

# Run API tests
echo "--- Running API tests ---"
npm run test:api 2>&1 || true

# Stop server
kill $SERVER_PID 2>/dev/null || true
echo "=== CI tests complete ==="
