# Backend Analysis

## 1. Backend role in the system

The Django backend is the operational core of the platform. It owns:
- identity,
- authorization,
- domain models,
- appeal workflow,
- persistence,
- analytics aggregation,
- Telegram integration,
- most business rules.

The frontend and bot are mostly adapters over backend functionality.

---

## 2. Project structure

Top-level backend pieces:
- `amanat/settings/` - environment-specific settings
- `amanat/urls.py` - root API routing
- `amanat/asgi.py` - ASGI/channels entrypoint intent
- `amanat/wsgi.py` - WSGI production path used by Docker
- `amanat/celery.py` - Celery app bootstrap
- `apps/` - domain apps
- `core/utils/` - OpenAI, Telegram, validation helpers
- `core/middleware/` - request logging middleware

Installed apps in `base.py`:
- `accounts`
- `citizens`
- `deputies`
- `appeals`
- `chat`
- `analytics`
- `notifications`

---

## 3. Settings and runtime model

### Base settings
Key defaults in `amanat/settings/base.py`:
- custom auth model: `accounts.User`
- default auth: JWT
- default permission: authenticated
- pagination: page number, page size 20
- timezone: `Asia/Almaty`
- channels layer: in-memory by default
- cache: local memory cache
- OpenAI and Telegram tokens optional
- `APPEAL_MESSAGE_LIMIT` default 10

### Development settings
- `DEBUG=True`
- PostgreSQL on localhost by environment variables
- console email backend

### Production settings
- parses `DATABASE_URL`
- secure cookies / HSTS
- extends CORS for production domain

### Architectural consequence
The backend is configured for a traditional API server first, with optional async and websocket features layered on top.

---

## 4. Root URL map

File: `backend/amanat/urls.py`

Main routes:
- `/admin/`
- `/api/schema/`
- `/api/docs/`
- `/api/auth/` -> accounts URLs
- `/api/accounts/` -> same accounts URLs again
- `/api/appeals/`
- `/api/chat/`
- `/api/analytics/`
- `/api/citizens/`
- `/api/deputies/`

Important detail:
The accounts app is mounted twice:
- once under `/api/auth/`
- once under `/api/accounts/`

That means some endpoints are intentionally or accidentally reachable by two URL prefixes.

---

## 5. Domain model overview

### 5.1 User model
File: `apps/accounts/models.py`

Custom `User` extends `AbstractUser` and adds:
- UUID primary key,
- `phone`,
- `user_type` (`citizen` or `deputy`),
- `telegram_user_id`,
- `telegram_chat_id`.

This is the root identity record.

### 5.2 Citizen model
File: `apps/citizens/models.py`

Citizen adds:
- one-to-one link to user,
- human profile data,
- constituency,
- Telegram identifiers,
- `assigned_deputy`.

### 5.3 Deputy model
File: `apps/deputies/models.py`

Deputy adds:
- one-to-one link to user,
- district,
- constituency,
- Telegram chat id,
- active flag.

### 5.4 Appeal model
File: `apps/appeals/models.py`

Appeal is the central workflow object with:
- citizen,
- deputy,
- title,
- description,
- category,
- status,
- priority,
- `message_count`,
- timestamps for creation/response/closure,
- satisfaction rating.

Indexes exist for:
- `(status, created_at)`
- `(deputy, status)`

### 5.5 Messaging models
There are two major messaging constructs.

#### In appeals app
`AppealMessage`
- tied to appeal,
- sender type,
- sender user,
- visible-to-citizen flag.

#### In chat app
`Message`
- tied to appeal,
- sender/receiver users,
- channel type (`telegram` or `web`),
- read flag.

This dual model is important because the code uses both.

### 5.6 Notification models
`NotificationTemplate`, `Notification`, `UserNotificationPreference`, `NotificationLog`

These support a formal notification subsystem, though many flows also bypass it and send Telegram directly.

### 5.7 Analytics models
Saved analytics/reporting models include:
- `DashboardWidget`
- `AnalyticsReport`
- `AppealAnalytics`
- `UserActivityLog`
- `SystemPerformanceMetrics`

---

## 6. Accounts app analysis

### Main responsibility
Authentication, identity serialization, Telegram auth/linking, admin user management.

### Login flow
`LoginView.post()`:
1. validates username/password,
2. authenticates with Django auth,
3. issues SimpleJWT tokens,
4. returns tokens + serialized user.

### Registration flow
`RegisterView.post()`:
1. validates form,
2. serializer forces `user_type='citizen'`,
3. creates user,
4. creates citizen profile,
5. assigns random active deputy if possible.

### Telegram WebApp auth flow
`TelegramAuthView.post()`:
1. receives Telegram `init_data`,
2. validates HMAC hash using bot token,
3. checks timestamp freshness,
4. extracts Telegram user id,
5. looks up matching `User` or `Citizen`,
6. syncs Telegram id back to user if needed,
7. returns JWT tokens.

This is the main citizen web-auth path inside Telegram WebApp.

### Deputy Telegram linking flow
Two endpoints:
- `GenerateTelegramLinkCodeView`
- `VerifyTelegramLinkCodeView`

Process:
1. authenticated deputy requests one-time 6-digit code,
2. code is stored in cache for 5 minutes,
3. bot or client submits code with Telegram ids,
4. backend binds Telegram identifiers onto user and deputy profile.

### Admin user management
`views_admin.py` supports:
- list/query all users,
- platform statistics,
- toggle active state,
- sample CSV download,
- CSV bulk import.

CSV import does a lot:
1. validate CSV headers,
2. validate each row,
3. create user,
4. create citizen or deputy profile,
5. for deputy also create `DeputyConstituency` row,
6. run a simple integrity check afterward.

This import path is clearly intended as a major operational onboarding mechanism.

---

## 7. Citizens app analysis

### Main responsibility
Citizen profile and Telegram-side citizen registration/linking.

### Citizen detail flow
`CitizenDetailView` returns the authenticated user’s citizen profile.

### Document flow
- list/create citizen documents,
- retrieve/update/delete a document.

### Telegram existence check
`check_citizen()` is a key bot endpoint.

It checks by `telegram_user_id`:
- citizen exists,
- phone exists,
- preregistered user exists,
- deputy fallback if Telegram id belongs to a deputy instead.

This endpoint acts like an identity probe for Telegram onboarding.

### Citizen register/link flow
`register_citizen()` handles multiple cases:
1. citizen already linked by Telegram id -> update and return,
2. if phone provided, try to match an unlinked preregistered citizen by phone,
3. if not matched, try to match a deputy user by phone,
4. otherwise reject with “not registered in system”.

Operationally this means the system is designed around **preregistration** for Telegram citizens. Telegram is not the primary source of truth for citizen creation.

---

## 8. Deputies app analysis

### Main responsibility
Deputy profile and deputy-specific metadata.

Supports:
- get/update own deputy profile,
- list/create/update/delete deputy constituencies,
- list/create/update/delete specializations,
- register deputy via API.

In practice, constituency data exists in two related forms:
- canonical constituency in `citizens.Constituency`
- per-deputy constituency records in `deputies.DeputyConstituency`

So the model contains both a shared canonical geography record and a deputy-owned copy/relationship record.

---

## 9. Appeals app analysis

### Main responsibility
Appeal submission and lifecycle management.

### Appeal creation from authenticated web citizen
`AppealViewSet.perform_create()`:
1. ensure current user is a citizen,
2. ensure citizen profile exists,
3. ensure citizen has phone,
4. ensure citizen has constituency,
5. find active deputy for that constituency,
6. fallback to assigned deputy,
7. fallback to random active deputy,
8. categorize via `OpenAIService` if possible,
9. create appeal with status `pending`,
10. optionally notify deputy via Telegram.

This is the cleanest expression of the intended business flow.

### Appeal listing rules
`get_queryset()`:
- admin sees all appeals,
- deputy sees appeals assigned to own deputy profile,
- citizen sees own appeals only.

### Appeal messages via deputy
`send_message` action:
1. only deputy/staff can send,
2. enforce message limit,
3. create `AppealMessage`,
4. increment appeal message count,
5. create `chat.Message` too,
6. notify citizen via Telegram.

### Appeal status update
`update_status` action:
1. only deputy/staff,
2. optionally store comment,
3. optionally log internal notes,
4. change status,
5. set `closed_at` for final states,
6. optional citizen-visible system message,
7. optional Telegram message to citizen.

### Appeal creation from Telegram bot
`create_appeal_bot()`:
1. receive `telegram_user_id` and description,
2. load citizen by Telegram id,
3. ensure citizen is preregistered and has linked user,
4. ensure phone exists,
5. resolve deputy by constituency or assigned deputy,
6. fail with support message if no deputy,
7. run AI categorization if possible,
8. create appeal,
9. notify deputy on Telegram,
10. return structured payload for bot reply.

### Unified deputy response endpoint
`deputy_respond_to_appeal()` combines:
- status change,
- message send,
- notification send.

It is effectively the most end-to-end deputy workflow API.

---

## 10. Chat app analysis

### Main responsibility
Secondary messaging subsystem around appeals.

It contains:
- thread abstraction (`MessageThread`),
- direct message abstraction (`Message`),
- read receipts,
- websocket consumers,
- Telegram citizen response bridge.

### Thread model intent
The thread API appears to be designed for a more conventional conversation system:
- create thread per appeal,
- list thread messages,
- mark reads,
- notify via websocket groups.

### Appeal-centric reality
The rest of the project mostly uses appeal-based message exchange directly, not thread-based chat UX.

### Telegram citizen reply logic
Two key endpoints:
- `get_active_appeal_for_citizen_response`
- `send_message_from_citizen_to_deputy`

This logic tries to:
1. find active appeal where last message came from deputy,
2. ensure message limit not reached,
3. create citizen message in `chat.Message`,
4. mirror same message into `AppealMessage`,
5. increment appeal count,
6. optionally move appeal from `pending` to `in_progress`,
7. notify deputy via Telegram,
8. create in-app notification row.

This is one of the most important bridging workflows in the whole backend.

---

## 11. Analytics app analysis

### Main responsibility
Aggregation/reporting over appeals and users.

Public or semi-public endpoints provide:
- total/resolved/pending appeal stats,
- resolution rate,
- trend lines,
- category/status distribution,
- AI-generated narrative insights.

### AnalyticsService role
This service calculates:
- appeal statistics,
- deputy performance,
- user engagement,
- trend analysis,
- export dataframes,
- SLA compliance,
- performance metric queries.

This app is mostly analytical/reporting logic rather than transactional logic.

---

## 12. Notifications app analysis

### Main responsibility
Formal notification persistence and multi-channel send abstraction.

Features:
- create notification records,
- honor user preferences,
- send email/push/SMS/in-app,
- send by template,
- bulk send,
- async task wrappers,
- reminder scheduling,
- cleanup task.

### Practical reality
In the appeal and chat flows, direct `TelegramService` calls are more prominent than the formal notification service. So notifications exist in two modes:
- explicit record-based subsystem,
- direct procedural Telegram alerts.

---

## 13. OpenAI integration

File: `core/utils/openai_service.py`

Primary use in current business flow:
- categorize appeal text,
- set category and priority.

The system is designed to degrade gracefully:
- if OpenAI fails, appeal still gets created,
- category falls back to `other`,
- priority falls back to `normal`.

This is a good resiliency pattern for core transaction flow.

---

## 14. Telegram integration

File: `core/utils/telegram_service.py`

Backend uses this utility for:
- deputy new appeal notification,
- citizen status-change notification,
- citizen/deputy new message notification,
- daily summary delivery,
- generic bot API actions.

This makes Telegram a first-class outbound channel in the backend.

---

## 15. Background tasks

There are Celery task modules for appeals and notifications.

Examples:
- auto-close resolved appeals after 7 days,
- daily deputy summaries,
- async notification send,
- reminder scheduling,
- cleanup old notifications.

However, the production compose file does not run a dedicated Celery worker or Redis container. So these tasks are implemented in code but not fully represented in current production container topology.

---

## 16. Security model

### Authentication
- JWT via SimpleJWT for API auth.

### Authorization
Custom permission classes include:
- `IsDeputy`
- `IsCitizen`
- `IsAdmin`
- `IsDeputyOrReadOnly`
- `IsOwnerOrDeputy`

### Data isolation rules
- citizens see own appeals,
- deputies see appeals assigned to them,
- admins see all.

### Telegram security
- Telegram WebApp auth validates HMAC signature and freshness,
- deputy link codes expire after 5 minutes in cache.

---

## 17. Backend architecture summary

The backend is best described as:
- a monolithic Django application,
- with strong domain separation by app,
- with appeal workflow as the center,
- with Telegram as a major secondary interface,
- with analytics and notifications as supporting subsystems,
- and with some partially completed async/realtime features.
