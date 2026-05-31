# --- STAGE 1: CLIENT BUILD ---
FROM node:20-slim AS client-builder

WORKDIR /client-build

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# --- STAGE 2: API BUILD ---
FROM node:20-slim AS builder

WORKDIR /app

# install build dependencies needed for bcrypt or other native packages
RUN apt-get update && apt-get install -y python3 make g++ openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

# install all dependencies to run migrations and compile schema
RUN npm ci

# generate prisma client binary
RUN npx prisma generate

# --- STAGE 3: PRODUCTION STAGE ---
FROM node:20-slim

WORKDIR /app

# install curl and openssl for container health checks and prisma
RUN apt-get update && apt-get install -y curl openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY src ./src

# copy the compiled frontend assets from Stage 1 into the public folder
COPY --from=client-builder /client-build/dist ./public

# create a script to handle startup migrations and seeds
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# expose HTTP (3000) and WebSocket (8080) ports
EXPOSE 3000 8080

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]
