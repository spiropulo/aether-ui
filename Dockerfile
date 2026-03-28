# --- SPA build ---
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# --- Gateway + static ---
FROM python:3.12-slim-bookworm
WORKDIR /app
COPY docker/gateway-requirements.txt .
RUN pip install --no-cache-dir -r gateway-requirements.txt
COPY docker/gateway.py /app/gateway.py
COPY --from=build /app/dist /app/static
ENV AETHER_STATIC_DIR=/app/static
EXPOSE 8080
CMD ["sh", "-c", "exec uvicorn gateway:app --host 0.0.0.0 --port ${PORT:-8080}"]
