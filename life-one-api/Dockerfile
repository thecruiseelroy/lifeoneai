# Minimal Dockerfile for Life One API (Railway, Fly.io, or any container host).
# Build: docker build -t life-one-api .
# Run:   docker run -p 8765:8765 -e CORS_ORIGINS="https://lifeoneai.com" life-one-api
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
# Exclude local DB/data if you want fresh DB in container (optional: add .dockerignore)
ENV PORT=8765
EXPOSE 8765

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
