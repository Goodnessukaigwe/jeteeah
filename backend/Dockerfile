# Multi-stage Dockerfile for Backend Service

# Base stage
FROM node:20-alpine AS base
WORKDIR /app/backend
RUN apk add --no-cache libc6-compat

# Development stage
FROM base AS development
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

# Builder stage
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build 2>/dev/null || echo "No build script defined"

# Production stage
FROM base AS production
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder /app/backend .
EXPOSE 3001
CMD ["node", "server.js"]
