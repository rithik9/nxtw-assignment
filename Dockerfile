# --- BUILD STAGE ---
FROM node:20-alpine AS builder

WORKDIR /app

# install build dependencies needed for bcrypt or other native packages
RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY prisma ./prisma/

# install all dependencies to run migrations and compile schema
RUN npm ci

# generate prisma client binary
RUN npx prisma generate

# --- PRODUCTION STAGE ---
FROM node:20-alpine

WORKDIR /app

# install curl for container health checks
RUN apk add --no-cache curl

ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY src ./src

# create a script to handle startup migrations and seeds
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# expose HTTP (3000) and WebSocket (8080) ports
EXPOSE 3000 8080

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]
