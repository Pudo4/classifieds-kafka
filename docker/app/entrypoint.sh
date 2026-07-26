#!/bin/sh
# Migrate-then-start, keyed off whether a compiled migrate script exists for
# this service -- `search` and `bff` own no database and have none, the
# other five do. One entrypoint shared by every service image (see root
# Dockerfile) instead of five almost-identical CMD lines.
set -e

MIGRATE="services/$SERVICE/dist/infrastructure/drizzle/migrate.js"
if [ -f "$MIGRATE" ]; then
  echo "[$SERVICE] running db:migrate"
  # Retried, not a single attempt: on a fresh volume, Postgres runs
  # docker-entrypoint-initdb.d (our per-service CREATE DATABASE/ROLE
  # script) against a *temporary* internal instance, then restarts into
  # the real one -- `pg_isready` can report healthy during that brief
  # window right before the restart, so `depends_on: condition:
  # service_healthy` doesn't fully rule out connecting during the gap.
  attempt=0
  until node "$MIGRATE"; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 10 ]; then
      echo "[$SERVICE] db:migrate still failing after $attempt attempts, giving up"
      exit 1
    fi
    echo "[$SERVICE] db:migrate failed (attempt $attempt/10), retrying in 2s"
    sleep 2
  done
fi

echo "[$SERVICE] starting"
exec node "services/$SERVICE/dist/entrypoints/main.js"
