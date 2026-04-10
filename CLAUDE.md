# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Amanat Citizen Platform (Digital Deputat) — a full-stack platform connecting citizens with deputies through an appeals management system. Three services: Django REST backend, Next.js frontend, and a Telegram bot.

## Common Commands

### Backend (from `backend/`)

```bash
# Install dependencies
pip install -r requirements/development.txt

# Run development server
python manage.py runserver

# Run migrations
python manage.py migrate

# Create system deputy (required for appeals without assigned deputy)
python manage.py create_not_identified_deputy

# Seed test data
python manage.py seed_data

# Bulk create users from CSV
python manage.py bulk_create_users

# Run tests
pytest

# Run a single test file
pytest apps/appeals/tests/test_views.py

# Run a single test
pytest apps/appeals/tests/test_views.py::TestClassName::test_method_name

# Run Celery worker
celery -A amanat worker -l info
```

### Frontend (from `frontend/`)

```bash
npm install
npm run dev          # Dev server on http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint
```

### Docker Production (from `deploy/`)

```bash
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml logs -f <service>
```

## Architecture

```
Frontend (Next.js 14, port 3000/3011)
    ↕ HTTP + WebSocket
Backend API (Django 5 + DRF, port 8000/8011)
    ↕                    ↕
PostgreSQL          Redis + Celery (background tasks)
    ↕
Telegram Bot (python-telegram-bot)
```

### Backend Structure

Django project at `backend/` with settings split into `amanat/settings/{base,development,production}.py`.

Seven Django apps under `backend/apps/`:
- **accounts** — Custom User model (UUID PK, `user_type` field), JWT auth via simplejwt, management commands for seeding
- **citizens** — Citizen profiles linked to User via OneToOne, district/constituency
- **deputies** — Deputy profiles, constituency mapping
- **appeals** — Core business logic: Appeal model with status lifecycle (`pending` → `in_progress` → `resolved`/`closed`/`rejected`), AI categorization via OpenAI, message threading (max 10 messages per appeal), attachments, comments
- **chat** — Real-time messaging via Django Channels
- **analytics** — Reporting and statistics endpoints
- **notifications** — Multi-channel notification dispatch

Shared utilities in `backend/core/utils/`:
- `openai_service.py` — Appeal auto-categorization
- `telegram_service.py` — Telegram notifications
- `validators.py` — Shared validation

Custom permissions in `apps/accounts/permissions.py` (IsOwnerOrDeputy, IsDeputy, etc.).

API docs auto-generated at `/api/docs/` via drf-spectacular.

### Frontend Structure

Next.js 14 App Router with locale-based routing (`src/app/[locale]/`).

Key patterns:
- **State**: Zustand stores with persist middleware (`src/lib/store/authStore.ts`, `appealStore.ts`)
- **Data fetching**: React Query (`@tanstack/react-query`) + Axios client (`src/lib/api/axios.ts`) with JWT interceptor
- **API modules**: `src/lib/api/{appeals,citizens,deputies,analytics,users,websocket}.ts`
- **Components**: Feature-grouped under `src/components/{appeals,citizen,deputy,admin,messages,analytics,home,layout}/`, reusable UI in `src/components/ui/`
- **Types**: `src/types/{appeal,user,citizen,deputy,common}.ts`
- **i18n**: next-intl with translations in `src/locales/` (Russian/Kazakh)
- **Styling**: Tailwind CSS + Radix UI primitives + class-variance-authority

## Key Configuration

- **Auth**: JWT with 60-min access tokens, 7-day refresh tokens (rotate on use)
- **Pagination**: DRF PageNumberPagination, PAGE_SIZE=20
- **Timezone**: Asia/Almaty
- **Custom user model**: `accounts.User` (AUTH_USER_MODEL)
- **Database**: PostgreSQL with composite indexes on Appeal (status, created_at) and (deputy, status)
- **Channel layer**: InMemoryChannelLayer in development; Redis in production
- **Settings module**: Controlled by `DJANGO_SETTINGS_MODULE`; pytest uses `amanat.settings.development`
- **CORS**: Explicit allowlist in base settings; add origins there when needed

## Production Deployment

Three Docker containers on `shared_network` (external) behind a reverse proxy:
- `digital-deputat-backend` (port 8011→8000, Gunicorn)
- `digital-deputat-frontend` (port 3011→3000, Next.js standalone)
- `digital-deputat-telegram-bot` (internal only)

PostgreSQL runs in a shared external container (`shared-postgres`).
