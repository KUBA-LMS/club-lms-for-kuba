FROM python:3.12-slim AS builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

RUN python -m venv .venv
COPY requirements.txt .
RUN .venv/bin/pip install -r requirements.txt

FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/.venv .venv/
COPY . .

EXPOSE 8002

CMD [".venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]
