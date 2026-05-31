#!/bin/sh
set -e

# wait a brief second to ensure external services (like Redis) are ready
echo "Starting up..."

# run prisma migrations to align sqlite DB schema
echo "Applying database migrations..."
npx prisma migrate deploy

# seed the database with core credentials ( ADMIN, MANAGER, MEMBER )
echo "Seeding default data..."
npx prisma db seed

# pass execution back to the Docker CMD (usually 'npm start')
echo "Launching application..."
exec "$@"
