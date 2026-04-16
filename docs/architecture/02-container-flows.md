# Container Flows

## 1. Production containers and network

From `deploy/docker-compose.prod.yml`, three application containers run on the external Docker network `shared_network`:

- `digital-deputat-backend`
- `digital-deputat-frontend`
- `digital-deputat-telegram-bot`

An external PostgreSQL container named `shared-postgres` is assumed to already exist on the same network.

### Port exposure
- Backend: `127.0.0.1:8011 -> 8000`
- Frontend: `127.0.0.1:3011 -> 3000`
- Telegram bot: no public port

This means:
- the browser normally hits the frontend via reverse proxy or localhost mapping,
- the frontend hits the backend via public URL or internal service URL depending on context,
- the Telegram bot talks to the backend only over the Docker network.

---

## 2. Backend container flow

### 2.1 Build flow
File: `backend/Dockerfile`

Build stages are simple:
1. start from `python:3.11-slim`,
2. install `postgresql-client`, `build-essential`, `libpq-dev`,
3. copy `requirements/base.txt` and `requirements/production.txt`,
4. `pip install -r requirements/production.txt`,
5. copy project source into `/app`,
6. remove `/app/.env`,
7. expose port `8000`.

### 2.2 Runtime startup flow
Container command:

```sh
python manage.py migrate --noinput && \
python manage.py collectstatic --noinput && \
python manage.py create_not_identified_deputy && \
python manage.py create_test_users && \
gunicorn --bind 0.0.0.0:8000 --workers 3 amanat.wsgi:application
```

Actual startup sequence:
1. connect to Postgres using `DATABASE_URL`,
2. run migrations,
3. collect static files,
4. ensure a fallback system deputy exists,
5. create test users,
6. start Gunicorn with 3 workers serving WSGI.

### 2.3 Important implication
Although Django Channels and ASGI code exist, the production container starts **Gunicorn WSGI**, not an ASGI server like Daphne/Uvicorn. So in deployed form:
- standard HTTP APIs work,
- websocket support is not fully wired as a first-class production runtime path.

---

## 3. Frontend container flow

### 3.1 Build flow
File: `frontend/Dockerfile`

This is a multi-stage Next.js standalone build.

Build sequence:
1. `deps` stage installs node dependencies via lockfile,
2. `builder` stage copies source and runs `npm run build`,
3. `NEXT_PUBLIC_API_URL` is injected at build time,
4. `runner` stage copies `.next/standalone` and static assets,
5. app runs as non-root `nextjs` user,
6. starts via `node server.js`.

### 3.2 Runtime flow
At runtime the frontend:
1. serves locale-aware Next.js routes,
2. renders pages/server components,
3. calls backend APIs using Axios on the client and Axios in server-side page code,
4. uses persisted auth state in browser local storage,
5. optionally tries Telegram WebApp authentication if inside Telegram.

Environment values used in production:
- `NEXT_PUBLIC_API_URL=https://digital-deputat.birqadam.kz/api`
- `INTERNAL_API_URL=http://digital-deputat-backend:8000`

In the current code, the public API URL is the dominant client-facing value.

---

## 4. Telegram bot container flow

### 4.1 Build flow
File: `telegram_bot/Dockerfile`

Build sequence:
1. start from `python:3.11-slim`,
2. install light Python deps directly with pip,
3. copy `bot.py`,
4. run `python bot.py`.

### 4.2 Runtime flow
At runtime the bot:
1. reads `TELEGRAM_BOT_TOKEN` and `API_BASE_URL`,
2. starts long polling against Telegram,
3. receives user messages/commands,
4. calls backend REST endpoints with `requests`,
5. formats backend results into Telegram chat responses.

This container is stateless except for in-memory conversation state managed by the bot framework.

---

## 5. Database container role

The database is external to this compose file.

It stores persistent records for:
- users,
- citizens,
- deputies,
- constituencies,
- appeals,
- appeal messages,
- chat messages,
- analytics records,
- notifications,
- preferences,
- logs.

The backend is the only service directly connected to the database.
The frontend and bot never talk to Postgres directly.

---

## 6. Container-to-container communication map

```text
Browser --> Frontend
Browser --> Backend (API calls, possibly via same public domain)
Frontend --> Backend
Telegram Bot --> Backend
Backend --> PostgreSQL
Backend --> Telegram Bot API
Backend --> OpenAI API
Telegram Bot --> Telegram Bot API
```

There is no direct communication:
- frontend -> PostgreSQL
- bot -> PostgreSQL
- frontend -> bot

---

## 7. End-to-end flow: user logs in from web

### Actor
Deputy or admin using web UI.

### Flow
1. browser opens frontend login page,
2. login form submits username/password to backend endpoint `/api/auth/login/`,
3. backend authenticates user and returns JWT access/refresh tokens plus serialized user,
4. frontend stores access token in Zustand/local storage,
5. frontend redirects user based on role:
   - admin -> `/admin/dashboard`
   - deputy -> `/deputy/dashboard`
   - citizen -> `/citizen/dashboard`
6. later API calls include `Authorization: Bearer <token>`.

### Container path
`Browser -> Frontend -> Backend -> PostgreSQL`

---

## 8. End-to-end flow: citizen opens Telegram bot and creates appeal

### Actor
Citizen using Telegram bot.

### Flow
1. citizen sends `/start` to Telegram bot,
2. Telegram sends update to bot container via polling response,
3. bot calls backend `POST /api/citizens/register/` with Telegram identifiers,
4. backend tries to link citizen by Telegram ID or phone-based preregistration,
5. citizen sends `/appeal`,
6. bot checks backend `GET /api/citizens/check/?telegram_user_id=...`,
7. if phone missing, bot asks for contact share,
8. bot sends phone to backend `POST /api/citizens/register/`,
9. citizen sends appeal description,
10. bot calls backend `POST /api/appeals/create/`,
11. backend finds citizen and deputy, categorizes appeal, creates appeal row,
12. backend optionally sends Telegram notification to deputy,
13. bot confirms success to citizen.

### Container path
`Citizen in Telegram -> Telegram network -> Bot container -> Backend -> PostgreSQL`
with optional outbound calls:
`Backend -> OpenAI API`
`Backend -> Telegram Bot API`

---

## 9. End-to-end flow: deputy answers an appeal from web UI

### Actor
Deputy in web dashboard.

### Flow
1. deputy authenticates in frontend,
2. frontend fetches appeals via `/api/appeals/`,
3. deputy opens one appeal detail page,
4. deputy sends status update and/or message to `/api/appeals/<id>/respond/` or `/update_status/`,
5. backend validates deputy ownership,
6. backend updates status/timestamps,
7. backend creates `AppealMessage`,
8. backend also creates chat `Message` for some paths,
9. backend increments `message_count`,
10. backend sends citizen Telegram notification if Telegram chat is linked,
11. frontend refreshes appeal state.

### Container path
`Browser -> Frontend -> Backend -> PostgreSQL`
plus optional:
`Backend -> Telegram Bot API`

---

## 10. End-to-end flow: citizen replies to deputy from Telegram

### Intended flow
1. deputy message reaches citizen via Telegram,
2. citizen sends plain text reply in bot chat,
3. bot asks backend which appeal is currently awaiting citizen response,
4. backend identifies the latest active appeal where the last sender was the deputy,
5. bot posts citizen reply to backend,
6. backend stores message, increments count, possibly changes appeal to `in_progress`,
7. backend notifies deputy.

### Actual current implementation state
The repository contains code for this flow, but endpoint paths are misaligned between bot and backend. See `07-observed-gaps-and-risks.md`.

---

## 11. Public analytics flow

### Actor
Anonymous website visitor.

### Flow
1. visitor opens landing page,
2. frontend server/page code requests:
   - `/api/analytics/appeal-statistics/`
   - `/api/analytics/appeal-trends/`
3. backend aggregates counts from appeals and analytics tables,
4. frontend renders charts/stat cards.

### Container path
`Browser -> Frontend -> Backend -> PostgreSQL`

---

## 12. Notification flow

There are two notification styles in the codebase.

### 12.1 Direct immediate notifications
Used often in appeal/chat code.

Flow:
1. business action occurs,
2. backend directly instantiates `TelegramService`,
3. backend calls Telegram Bot API immediately.

### 12.2 Persisted notification records
Used by `apps.notifications`.

Flow:
1. backend creates `Notification` row,
2. service decides channel by preferences,
3. optional async Celery task can process delivery,
4. delivery status is updated.

Current implementation leans more on **direct Telegram sending** than on a complete async queue-driven notification pipeline.

---

## 13. WebSocket flow intent

The repository includes:
- Channels consumers,
- websocket routing,
- frontend `WebSocketService`.

Intended flow:
1. frontend opens websocket to `/ws/notifications/` or thread URLs,
2. backend subscribes user to group,
3. chat/message events are pushed to clients,
4. frontend invalidates cached queries and refreshes UI.

However, in current deployment/runtime this path is only partially connected because:
- the container runs WSGI/Gunicorn,
- ASGI references an incorrect routing module name,
- frontend websocket expectations do not exactly match backend routing/auth behavior.

---

## 14. Startup dependency order

From compose:
- frontend depends on backend,
- bot depends on backend,
- backend depends on external Postgres availability but compose does not manage that dependency.

Operationally the real order is:
1. ensure `shared_network` exists,
2. ensure `shared-postgres` exists and database exists,
3. start backend,
4. backend runs migrations/bootstrap commands,
5. start frontend,
6. start telegram bot,
7. reverse proxy points users to frontend/backend.

---

## 15. Container risk summary

### Backend container risks
- startup command does many boot-time mutations,
- WSGI mode limits real websocket use,
- production image contains test-user creation in startup path.

### Frontend container risks
- build-time API URL is static,
- some client code expects backend routes that do not exist exactly as written.

### Telegram bot risks
- strongly coupled to specific backend endpoint paths,
- no retry queue or local persistence,
- depends on backend availability for almost every action.

### Database dependency risk
- not part of compose-managed lifecycle,
- backend will fail if external DB/network is absent or misconfigured.
