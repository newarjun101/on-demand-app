#!/usr/bin/env bash
# Runs on the Lightsail instance (piped over SSH by .github/workflows/deploy-lightsail.yml).
# Pulls main, rebuilds the Docker Compose stack, applies Prisma migrations, and
# checks the backend health endpoint. Never seeds or resets the database.
#
# The script arrives on stdin, so everything lives in main() and bash reads the
# whole file before running anything. Commands also get </dev/null so none of
# them can swallow the rest of the script.
set -euo pipefail

main() {
  local repo_url="https://github.com/newarjun101/on-demand-app.git"
  local app_dir="${APP_DIR:-}"
  app_dir="${app_dir:-$HOME/on-demand-app}"
  local compose

  if docker compose version >/dev/null 2>&1 </dev/null; then
    compose=(docker compose)
  elif command -v docker-compose >/dev/null 2>&1; then
    compose=(docker-compose)
  else
    echo "Docker Compose is not installed on the server" >&2
    exit 1
  fi

  if [ ! -d "$app_dir/.git" ]; then
    echo "==> Cloning into $app_dir"
    git clone --branch main "$repo_url" "$app_dir" </dev/null
  fi

  cd "$app_dir"

  echo "==> Updating code"
  git fetch --prune origin main </dev/null
  git checkout main </dev/null
  # Fast-forward only: stops instead of overwriting local edits on the server.
  git merge --ff-only origin/main </dev/null
  echo "Deployed commit: $(git rev-parse --short HEAD) (pushed: ${DEPLOY_SHA:-unknown})"

  echo "==> Building images"
  "${compose[@]}" build </dev/null

  echo "==> Applying database migrations"
  "${compose[@]}" run --rm -T backend npx prisma migrate deploy </dev/null

  echo "==> Starting containers"
  "${compose[@]}" up -d --remove-orphans </dev/null

  echo "==> Waiting for backend health"
  local i
  for i in $(seq 1 30); do
    if curl -fsS http://localhost:4000/health >/dev/null </dev/null; then
      echo "Backend is healthy"
      "${compose[@]}" ps </dev/null
      docker image prune -f >/dev/null </dev/null
      echo "==> Deploy finished"
      return 0
    fi
    sleep 2
  done

  echo "Backend did not become healthy" >&2
  "${compose[@]}" ps </dev/null
  "${compose[@]}" logs --tail=100 backend </dev/null
  exit 1
}

main "$@"
