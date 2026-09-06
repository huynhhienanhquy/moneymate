FROM node:22-alpine AS builder

RUN apk add --no-cache openssl
WORKDIR /app
ENV SCARF_ANALYTICS=false
ENV COPILOTKIT_TELEMETRY_DISABLED=true

COPY . .
RUN npm ci

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_COPILOTKIT_ENABLED=false
ENV VITE_COPILOTKIT_ENABLED=$VITE_COPILOTKIT_ENABLED
RUN npm run build:packages && npm run build --workspace=moneymate-frontend

FROM nginx:alpine

COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY --from=builder /app/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
