# System Overview

## 1. Purpose of the platform

Amanat is a citizen-to-deputy appeals platform. Its core job is to let:
- citizens submit appeals,
- deputies review and respond,
- admins manage users and constituencies,
- the public see aggregate analytics,
- Telegram users interact with the system without using the main web UI directly.

At a business level, the platform centers on one main object: the **appeal**.

An appeal moves through this broad lifecycle:
1. citizen is identified,
2. citizen submits an appeal,
3. system assigns a deputy,
4. system categorizes the appeal,
5. deputy responds and changes status,
6. citizen may continue the dialog,
7. appeal is resolved/closed/rejected,
8. analytics and notifications are generated around that lifecycle.

---

## 2. Main runtime components

The repository contains three runnable services and one external dependency set.

### 2.1 Frontend container
Location: `frontend/`

Technology:
- Next.js 14
- React 18
- TypeScript
- next-intl
- React Query
- Zustand
- Axios

Responsibilities:
- public landing page,
- login and registration,
- admin dashboard,
- deputy dashboard,
- citizen UI inside Telegram WebApp context,
- client-side API integration with backend,
- limited real-time support via WebSocket client code.

### 2.2 Backend container
Location: `backend/`

Technology:
- Django 5
- Django REST Framework
- SimpleJWT
- Django Channels
- Celery configuration present
- PostgreSQL
- optional OpenAI and Telegram integrations

Responsibilities:
- central domain and business logic,
- authentication,
- user/profile management,
- appeal lifecycle,
- citizen/deputy/admin APIs,
- analytics APIs,
- chat/message persistence,
- Telegram-facing endpoints,
- notifications.

### 2.3 Telegram bot container
Location: `telegram_bot/`

Technology:
- Python 3.11
- `python-telegram-bot`
- `requests`

Responsibilities:
- onboarding citizens in Telegram,
- collecting phone/contact information,
- creating appeals from chat,
- listing user appeals,
- sending citizen reply messages back to the backend.

### 2.4 External services / infrastructure
Not built by this repo but assumed in deployment:
- PostgreSQL container: `shared-postgres`
- Docker network: `shared_network`
- reverse proxy / TLS terminator in front of frontend/backend
- optionally Redis for Celery/channels in production intent
- OpenAI API
- Telegram Bot API

---

## 3. Production deployment shape

From `deploy/docker-compose.prod.yml`, the intended production topology is:

```text
Internet / Browser / Telegram
        |
        v
Reverse proxy / domain routing
        |
        +--> Frontend container (`digital-deputat-frontend`) :3000, host 3011
        |
        +--> Backend container (`digital-deputat-backend`) :8000, host 8011
                     |
                     +--> PostgreSQL (`shared-postgres`) :5432
                     +--> OpenAI API (optional)
                     +--> Telegram Bot API (optional)

Telegram bot container (`digital-deputat-telegram-bot`)
        |
        +--> Backend container over Docker network
        +--> Telegram Bot API
```

Important detail:
- only frontend and backend expose localhost-bound ports on the host,
- bot is internal-only,
- all services share one external Docker network.

---

## 4. Container responsibilities in one sentence

- **Frontend** = presentation and client orchestration.
- **Backend** = source of truth and workflow engine.
- **Telegram bot** = conversational input/output adapter for citizens.
- **PostgreSQL** = persistent state store.

---

## 5. High-level functional architecture

```text
Citizen/Deputy/Admin UI (Next.js)
            |
            | HTTP JSON API
            v
      Django REST Backend
            |
   +--------+--------+------------------+
   |        |        |                  |
   |        |        |                  |
Postgres  Telegram  OpenAI         Channels/WebSocket
   |       outbound  categorization   notifications/chat intent
   |
Telegram Bot -> calls backend HTTP endpoints
```

---

## 6. Main business domains in the backend

The Django backend is organized into apps.

### accounts
Manages:
- custom `User` model,
- login/registration,
- admin user management,
- Telegram authentication and link-code flow.

### citizens
Manages:
- citizen profile,
- constituency,
- citizen documents,
- Telegram citizen registration/linking.

### deputies
Manages:
- deputy profile,
- deputy constituencies,
- deputy specializations.

### appeals
Manages:
- appeal creation,
- assignment,
- AI categorization,
- status updates,
- deputy responses,
- appeal messages, comments, attachments.

### chat
Manages:
- message records,
- message threads,
- read state,
- some Telegram-response bridging,
- websocket consumers.

### analytics
Manages:
- public and authenticated metrics,
- trend endpoints,
- AI-generated insight aggregation,
- saved reports and widgets.

### notifications
Manages:
- notification records,
- templates,
- preferences,
- async/scheduled tasks.

---

## 7. Identity model

There is a single custom Django `User` model with:
- UUID primary key,
- `user_type` = `citizen` or `deputy`,
- Telegram identifiers on the user record,
- normal Django auth fields.

Roles in practice are derived like this:
- `is_staff` / `is_superuser` => admin,
- `user_type='deputy'` => deputy,
- `user_type='citizen'` => citizen.

Separate profile tables hold role-specific details:
- `Citizen` via `user.citizen_profile`
- `Deputy` via `user.deputy_profile`

---

## 8. Appeal-centric operating model

The appeal model is the core coordination point.

Each appeal links:
- one citizen,
- one deputy,
- one category,
- one status,
- one message count,
- optional timestamps for response and closure.

Appeal status values:
- `pending`
- `in_progress`
- `resolved`
- `closed`
- `rejected`

The repository implements two parallel message representations around appeals:
1. `apps.appeals.models.AppealMessage`
2. `apps.chat.models.Message`

That means the system stores dialog information in **two overlapping places**, which strongly affects the real flow and is discussed later in the gaps document.

---

## 9. Public vs authenticated surfaces

### Publicly consumable endpoints/pages
- landing page,
- public stats/trends,
- Telegram-oriented endpoints with `AllowAny`,
- some analytics endpoints,
- bot registration/check APIs.

### Authenticated surfaces
- login-protected user profile,
- citizen cabinet,
- deputy cabinet,
- admin user management,
- appeal CRUD and status updates,
- saved reports/widgets.

---

## 10. What the system is trying to optimize for

Judging from code structure, the platform aims to optimize for:
- easy citizen onboarding through Telegram,
- constituency-based deputy assignment,
- rapid appeal intake,
- clear deputy workflows,
- lightweight analytics for platform visibility,
- optional AI assistance rather than AI dependency.

The implementation generally follows that direction, though several integrations are only partially aligned.
