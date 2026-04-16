# Development Workflow and Local Setup

## 1. Recommended development workflow

The simplest local workflow is now:

1. copy the root env example,
2. run Docker Compose from the repo root,
3. work with hot reload inside containers.

Recommended command flow:

```bash
cp .env.example .env
docker compose up --build
```

This gives you:
- containerized Postgres,
- containerized Redis,
- Django backend in dev mode,
- Celery worker in dev mode,
- Next.js frontend in dev mode,
- optional Telegram bot.

---

## 2. Dev files available

### Root-level easy workflow
- `compose.yaml`
- `.env.example`

These are for the easiest workflow:
- `docker compose up`
- `docker compose down`

### Explicit deploy-scoped dev workflow
- `deploy/docker-compose.dev.yml`
- `deploy/.env.dev.example`

These remain available if you want explicit file paths.

### Service-level env examples
- `backend/.env.example`
- `frontend/.env.example`
- `telegram_bot/.env.example`

These are mainly for host-run or hybrid workflows.

---

## 3. Dev stack layout

The local Docker dev stack contains:
- `db` - PostgreSQL
- `redis` - Redis
- `backend` - Django dev server
- `worker` - Celery worker
- `frontend` - Next.js dev server
- `telegram_bot` - optional via Compose profile `bot`

Local URLs:
- frontend: `http://localhost:3000`
- backend API: `http://localhost:8000`
- backend docs: `http://localhost:8000/api/docs/`
- postgres: `localhost:5432`
- redis: `localhost:6379`

---

## 4. First-time setup

### 4.1 Easiest setup
From repo root:

```bash
cp .env.example .env
```

Then edit `.env` if needed.

Most common values to adjust:
- `SECRET_KEY`
- `POSTGRES_PASSWORD`
- `OPENAI_API_KEY` if testing AI categorization
- `TELEGRAM_BOT_TOKEN` if testing the Telegram bot

### 4.2 Start the stack

```bash
docker compose up --build
```

### 4.3 Start the bot too

```bash
docker compose --profile bot up --build
```

Use the bot profile only when you are actively testing Telegram flows.

---

## 5. What happens on startup

### Backend startup
The backend container runs:
1. `python manage.py migrate`
2. `python manage.py create_not_identified_deputy`
3. `python manage.py create_test_users`
4. `python manage.py runserver 0.0.0.0:8000`

So after startup:
- schema should be migrated,
- fallback deputy should exist,
- test users should be created,
- dev server should be ready.

### Frontend startup
The frontend runs Next.js dev mode with the project mounted into the container.

### Worker startup
The worker starts Celery against Redis in development mode.

### Bot startup
If enabled, the bot runs long polling and talks to the backend over the Docker network.

---

## 6. Day-to-day commands

### Start

```bash
docker compose up
```

### Start with rebuild

```bash
docker compose up --build
```

### Start in background

```bash
docker compose up -d
```

### Stop

```bash
docker compose down
```

### Stop and wipe volumes

```bash
docker compose down -v
```

Use `-v` only if you intentionally want to wipe local DB/cache state.

### Start with bot

```bash
docker compose --profile bot up
```

### Start with bot and rebuild

```bash
docker compose --profile bot up --build
```

---

## 7. Logs

### All logs

```bash
docker compose logs -f
```

### Service-specific logs

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f worker
docker compose logs -f db
docker compose logs -f telegram_bot
```

---

## 8. Running commands inside containers

### Django superuser

```bash
docker compose exec backend python manage.py createsuperuser
```

### Django shell

```bash
docker compose exec backend python manage.py shell
```

### Seed data

```bash
docker compose exec backend python manage.py seed_data
```

### Bulk create users

```bash
docker compose exec backend python manage.py bulk_create_users
```

### Run backend tests

```bash
docker compose exec backend pytest
```

### Run frontend lint

```bash
docker compose exec frontend npm run lint
```

### Open psql

```bash
docker compose exec db psql -U postgres -d amanat_dev
```

If you changed DB values in `.env`, use those values instead.

---

## 9. Recommended workflow by task

### UI-only work
Usually enough:
- frontend
- backend
- db

### API/business logic work
Usually enough:
- backend
- db
- redis
- worker

### Telegram integration work
Use:
- `docker compose --profile bot up`

### Analytics/report work
Usually enough:
- frontend
- backend
- db

---

## 10. Environment rules for dev

### OpenAI
Leave `OPENAI_API_KEY` empty if you are not testing AI categorization.
The backend has fallback behavior.

### Telegram
Leave `TELEGRAM_BOT_TOKEN` empty unless testing the bot.
If you start the bot profile without a valid token, the bot will fail.

### Frontend API URL
Default local browser URL is already set to:
- `NEXT_PUBLIC_API_URL=http://localhost:8000/api`

---

## 11. Alternate explicit workflow still supported

If you want the old explicit file-path form, it still works:

```bash
cp deploy/.env.dev.example deploy/.env.dev
docker compose --env-file deploy/.env.dev -f deploy/docker-compose.dev.yml up --build
```

And with bot:

```bash
docker compose --env-file deploy/.env.dev -f deploy/docker-compose.dev.yml --profile bot up --build
```

But for normal local work, prefer the simpler root-level workflow.

---

## 12. Team conventions

Recommended conventions:

1. use root `compose.yaml` for normal local development,
2. use root `.env` for Docker dev values,
3. use `docker compose exec backend ...` for Django commands,
4. run bot only when needed,
5. use `down -v` only when you intentionally want a clean slate,
6. rebuild after dependency or Dockerfile changes.

---

## 13. Short quick-start

```bash
cp .env.example .env
docker compose up --build
```

Optional bot:

```bash
docker compose --profile bot up --build
```
