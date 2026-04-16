# Observed Gaps and Risks

This document records important implementation mismatches discovered during analysis.

It does **not** mean the whole system is broken. It means the current repository contains several places where:
- intended architecture and actual implementation differ,
- integrations are partially wired,
- some flows are fragile or likely broken until aligned.

---

## 1. ASGI routing mismatch

File: `backend/amanat/asgi.py`

Observed:
- imports `apps.messages.routing`
- routes `apps.messages.routing.websocket_urlpatterns`

But the repository contains:
- `apps/chat/routing.py`
- not `apps/messages/routing.py`

### Impact
ASGI websocket startup would fail or route incorrectly unless another hidden module exists.

### Architectural meaning
Realtime support is not fully aligned with app naming/refactoring.

---

## 2. Production server is WSGI, not ASGI

File: `backend/Dockerfile`

Observed:
- container starts `gunicorn ... amanat.wsgi:application`

### Impact
Even though Channels consumers and websocket routing exist, production startup does not expose the ASGI app as the main serving process.

### Architectural meaning
HTTP APIs are first-class; websocket support is currently secondary/incomplete in actual deployment.

---

## 3. Telegram bot active-response endpoint path mismatch

Bot code expects:
- `GET {API_URL}/citizens/{user.id}/active_appeal_for_response/`

Backend actually exposes via chat URLs:
- `/api/chat/citizens/<telegram_user_id>/active_appeal_for_response/`

### Impact
Citizen free-text follow-up flow from bot is likely broken as written.

---

## 4. Telegram bot send-message endpoint path mismatch

Bot calls:
- `/chat/send_message_to_deputy/`

Backend path is:
- `/api/chat/send_message_to_deputy/`

Inside bot this usually works only if `API_URL` already contains `/api`; in this repo it does. So this one is structurally okay.

However, the previous mismatch on active-response discovery still blocks the full follow-up flow.

---

## 5. Duplicate message models create complexity

Two models are used for appeal dialog:
- `apps.appeals.models.AppealMessage`
- `apps.chat.models.Message`

### Impact
A single human message may need two writes.

### Risks
- divergence between tables,
- inconsistent unread/read state,
- different endpoints reading different sources,
- harder analytics and debugging.

### Architectural meaning
The system appears to be mid-transition between two messaging designs.

---

## 6. Thread-based chat views do not match current `Message` model cleanly

In `apps/chat/views.py`, some thread endpoints use concepts like:
- `thread_id`
- `message.thread`
- `sent_at`
- serializer save with `sender=user, thread=thread`

But the current `Message` model shown in `apps/chat/models.py` is appeal-based and does not visibly define those same fields.

### Impact
Parts of thread-oriented chat API are likely stale or incompatible with the current schema.

### Architectural meaning
Chat layer contains legacy/refactored code that was not fully consolidated.

---

## 7. Frontend WebSocket expectations do not fully match backend runtime

Frontend expects:
- websocket URL with token query param,
- notifications endpoint under `/ws/notifications/`.

Backend consumers exist, but:
- production runs WSGI,
- ASGI routing import is wrong,
- backend consumers do not show JWT query-param auth handling,
- routing paths are thread/notifications based, not appeal-based.

### Impact
Realtime client behavior is likely incomplete or unreliable in production.

---

## 8. Registration payload mismatch

Frontend register page sends:
- `phone`
- `user_type`

Backend `RegisterSerializer` fields are:
- `username`, `email`, `password`, `password_confirm`, `first_name`, `last_name`, `user_type`

But its `create()` method forces:
- `user_type = 'citizen'`

And does not include `phone` in serializer fields.

### Impact
Frontend is sending a `phone` field that the serializer does not explicitly accept.

### Architectural meaning
The UI and API contract are not fully synchronized.

---

## 9. Some view `get_object()` methods return `Response` instead of raising exceptions

Examples in citizen/deputy detail views.

### Impact
Generic DRF views expect model instances from `get_object()`, not `Response` objects. This can produce confusing behavior.

### Architectural meaning
Some error paths are implemented in a way that bypasses normal DRF patterns.

---

## 10. Appeal service references outdated modules/fields

File: `apps/appeals/services.py`

Observed examples:
- imports `apps.messages.models.Message`
- references `AppealCategory` without local import
- filters by `assigned_deputy` on `Appeal`, while model field is `deputy`
- orders by `submitted_at`, which current model does not define

### Impact
This service file appears partly stale and likely not safe as a canonical source of runtime behavior.

### Architectural meaning
The actual live behavior is more accurately represented by view logic than by this service module.

---

## 11. Celery support exists but worker/container is absent in production compose

Observed:
- Celery app exists,
- shared tasks exist,
- no Redis service in compose,
- no Celery worker container in compose.

### Impact
Async tasks are implemented at code level but not clearly operationalized in deployment.

### Architectural meaning
Background processing is an intended capability rather than a fully realized production topology in this repo.

---

## 12. Backend startup includes test-user creation in production image

Backend container startup runs:
- `create_test_users`

### Impact
Production boot may create demo/test data unless the command is no-op or guarded internally.

### Architectural meaning
Operational bootstrap and development bootstrap are not fully separated.

---

## 13. Accounts routes mounted twice

Routes are included under both:
- `/api/auth/`
- `/api/accounts/`

### Impact
Not necessarily broken, but increases ambiguity and can confuse frontend/backend contracts.

### Architectural meaning
Boundary between authentication endpoints and account-management endpoints is not strictly separated.

---

## 14. Analytics are mixed between public and authenticated endpoints

Some analytics endpoints use `AllowAny`, others require auth.

### Impact
This is fine if intentional, but public exposure should be explicitly reviewed for privacy/data sensitivity.

### Architectural meaning
Analytics layer serves both marketing/transparency and internal operations.

---

## 15. Overall risk summary

### Low-to-medium risk design issues
- duplicated route prefixes,
- mixed notification patterns,
- mixed onboarding models.

### Medium risk implementation issues
- stale service/thread code,
- frontend/backend contract drift,
- dual message models.

### Higher risk runtime issues
- websocket runtime mismatch,
- bot follow-up path mismatch,
- Celery not represented in production topology.

---

## 16. Final interpretation

The repository shows a real, substantial application with a coherent core idea and many working pieces.

The main architectural pattern is sound:
- backend-centric business logic,
- Next.js role-based UI,
- Telegram as a strong citizen channel.

But the repository also clearly shows signs of active iteration/refactoring, especially around:
- realtime/chat,
- Telegram follow-up messaging,
- async infrastructure,
- service/module naming consistency.

So the most accurate description is:

> The platform has a solid monolithic core with partially completed secondary subsystems around chat, realtime delivery, and async orchestration.
