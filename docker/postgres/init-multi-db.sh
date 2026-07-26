#!/bin/bash
# Runs once, on first container init, as the Postgres superuser.
# Creates one database + one owning user per service. Each user only ever
# gets privileges on its own database -- this is what makes "no service reads
# another service's tables" an engine-enforced rule instead of a convention.
set -euo pipefail

create_service_db() {
  local db_name="$1"
  local db_user="$2"
  local db_password="$3"

  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE USER "$db_user" WITH PASSWORD '$db_password';
    CREATE DATABASE "$db_name" OWNER "$db_user";
    REVOKE ALL PRIVILEGES ON DATABASE "$db_name" FROM PUBLIC;
    GRANT ALL PRIVILEGES ON DATABASE "$db_name" TO "$db_user";
EOSQL
}

create_service_db "$LISTING_DB_NAME" "$LISTING_DB_USER" "$LISTING_DB_PASSWORD"
create_service_db "$MEDIA_DB_NAME" "$MEDIA_DB_USER" "$MEDIA_DB_PASSWORD"
create_service_db "$ENGAGEMENT_DB_NAME" "$ENGAGEMENT_DB_USER" "$ENGAGEMENT_DB_PASSWORD"
create_service_db "$MODERATION_DB_NAME" "$MODERATION_DB_USER" "$MODERATION_DB_PASSWORD"
create_service_db "$NOTIFICATION_DB_NAME" "$NOTIFICATION_DB_USER" "$NOTIFICATION_DB_PASSWORD"
