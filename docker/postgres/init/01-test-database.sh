#!/bin/sh
# A separate database for automated tests, so test runs never touch your development data.
# Runs only when the postgres-data volume is created for the first time.
# POSTGRES_USER comes from the container environment (root .env), so the owner always matches.
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -c "CREATE DATABASE guacamole_test OWNER \"$POSTGRES_USER\";"
