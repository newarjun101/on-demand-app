#!/usr/bin/env bash
# Runs on the Lightsail instance (piped over SSH by .github/workflows/deploy-lightsail.yml).
# Pulls main, rebuilds the Docker Compose stack, applies Prisma migrations, and
# checks the backend health endpoint. Never seeds or resets the database.
set -euo pipefail

REPO_URL="https://github.com/newarjun101/on-demand-app.git"
APP_DIR="${APP_DIR:-}"
APP_DIR="${APP_DIR:-$HOME/on-demand-app}"

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "Docker Compose is not installed on the server" >&2
  exit 1
fi

if [ ! -d "$APP_DIR/.git" ]; then
  echo "==> Cloning into $APP_DIR"
  git clone --branch main "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

echo "==> Updating code"
git fetch --prune origin main
git checkout main
# Fast-forward only: stops instead of overwriting local edits on the server.
git merge --ff-only origin/main
echo "Deployed commit: $(git rev-parse --short HEAD) (pushed: ${DEPLOY_SHA:-unknown})"

echo "==> Building images"
"${COMPOSE[@]}" build

echo "==> Applying database migrations"
"${COMPOSE[@]}" run --rm backend npx prisma migrate deploy

echo "==> Starting containers"
"${COMPOSE[@]}" up -d --remove-orphans

echo "==> Waiting for backend health"
for _ in $(seq 1 30); do
  if curl -fsS http://localhost:4000/health >/dev/null; then
    echo "Backend is healthy"
    "${COMPOSE[@]}" ps
    docker image prune -f >/dev/null
    exit 0
  fi
  sleep 2
done

echo "Backend did not become healthy" >&2
"${COMPOSE[@]}" ps
"${COMPOSE[@]}" logs --tail=100 backend
exit 1
