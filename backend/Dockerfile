FROM node:22-alpine AS builder

RUN apk add --no-cache openssl
WORKDIR /app
ENV SCARF_ANALYTICS=false
ENV COPILOTKIT_TELEMETRY_DISABLED=true

COPY . .
RUN npm ci
RUN npm run prisma:generate --workspace=moneymate-backend
RUN npm run build:packages && npm run build --workspace=moneymate-backend
RUN mkdir -p backend/node_modules

FROM node:22-alpine

RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma

WORKDIR /app/backend

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
