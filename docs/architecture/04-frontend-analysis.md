# Frontend Analysis

## 1. Frontend role

The frontend is the user-facing presentation layer for:
- public visitors,
- admins,
- deputies,
- citizens inside Telegram WebApp.

It is not the source of truth. Nearly all real business state comes from backend APIs.

---

## 2. Technology stack

From `frontend/package.json`:
- Next.js 14
- React 18
- TypeScript
- next-intl for locale routing/translations
- React Query for server-state caching
- Zustand for auth/client state
- Axios for HTTP calls
- Tailwind + Radix UI for styling/components
- Recharts for charts
- Sonner for toasts

---

## 3. Build/runtime architecture

### Build
The frontend is built into a standalone Next.js server image.

### Runtime
At runtime it provides:
- server-rendered and client-rendered pages,
- locale-prefixed routing (`/ru`, `/kz`),
- API calls to backend,
- persisted auth across reloads,
- Telegram WebApp bootstrap for citizens.

### Key config
`next.config.mjs` sets:
- `output: 'standalone'`

This is why the Docker image can run with `node server.js`.

---

## 4. Routing model

### Locale routing
The project uses `next-intl` middleware and locale-aware app routes.

Key files:
- `middleware.ts`
- `src/i18n/routing.ts`
- `src/app/[locale]/...`

The middleware rewrites/handles localized routes like:
- `/ru/...`
- `/kz/...`

### Route families
The codebase has role-focused route segments:
- public pages
- `/[locale]/admin/...`
- `/[locale]/deputy/...`
- `/[locale]/citizen/...`
- auth pages (`login`, `register`)

---

## 5. Provider stack

In `src/app/[locale]/layout.tsx`, the frontend wraps pages with:
- Telegram WebApp script injection,
- `NextIntlClientProvider`,
- React Query `QueryClientProvider`,
- global toast provider,
- error boundary.

That means every localized page gets:
- translation context,
- query cache,
- toast UI,
- error fallback support.

---

## 6. Authentication architecture

### 6.1 Auth state store
File: `src/lib/store/authStore.ts`

Zustand store keeps:
- `user`
- `token`
- `isAuthenticated`
- hydration flag

Persistence uses browser local storage.

### 6.2 Normal web login flow
Login page:
1. user enters username/password,
2. frontend calls `usersApi.login()` -> `/auth/login/`,
3. backend returns access + refresh + user,
4. frontend stores access token in auth store,
5. frontend also stores legacy values in local storage,
6. redirect is role-based.

### 6.3 Telegram WebApp auth flow
`useTelegramAuth()`:
1. detect Telegram WebApp context,
2. read `initData`,
3. compare current stored Telegram user to avoid stale session reuse,
4. call `/accounts/telegram-auth/`,
5. receive backend-issued JWT,
6. store JWT and user in auth store.

This is critical for citizen access because citizen layout explicitly expects Telegram context.

### 6.4 Axios auth behavior
File: `src/lib/api/axios.ts`

Request interceptor:
- adds `Authorization: Bearer <token>` if available.

Response interceptor:
- on 401 inside Telegram WebApp, re-run Telegram auth automatically,
- otherwise logout and redirect to `/ru/login`.

This makes Telegram sessions more resilient than standard web sessions.

---

## 7. Route protection model

File: `src/components/common/RouteGuard.tsx`

`RouteGuard` enforces allowed roles:
- admin
- deputy
- citizen

Behavior:
1. wait for auth hydration,
2. optionally wait for Telegram auth attempt,
3. if unauthenticated outside Telegram -> redirect to login,
4. if in Telegram and backend rejects access -> show access-limited message,
5. if authenticated but wrong role -> redirect to role-appropriate dashboard.

### Citizen-specific extra guard
`src/app/[locale]/citizen/layout.tsx` blocks access outside Telegram and shows a message linking users to the Telegram bot.

So citizens are intentionally pushed toward Telegram-first usage.

---

## 8. API integration layer

API modules live in `src/lib/api/`.

### appeals API
Used for:
- list appeals,
- create appeal,
- get details,
- update status,
- respond,
- fetch dialogue messages,
- send message,
- mark messages read,
- delete appeal.

### citizens API
Used for:
- get/update profile,
- document CRUD.

### deputies API
Used for:
- own deputy profile,
- constituency CRUD via citizens app,
- specialization CRUD.

### analytics API
Used for:
- appeal statistics,
- trends/category data,
- response time data.

### users API
Used for:
- login,
- profile,
- update profile,
- password change,
- refresh token.

Architecturally this is a clean separation: pages/components do not usually hardcode URLs directly.

---

## 9. Role-specific UX flows

### 9.1 Public landing page
File: `src/app/[locale]/page.tsx`

This page:
- fetches statistics and trends from analytics endpoints,
- renders hero/marketing section,
- shows live platform metrics,
- shows category and status charts,
- routes users to login or register.

This gives the project a public transparency layer, not just a private app shell.

### 9.2 Citizen dashboard
Component: `CitizenDashboard.tsx`

Main functions:
- show greeting,
- CTA to create new appeal,
- show appeal counts by status,
- search/filter appeals,
- paginate appeals,
- link to profile,
- display message count per appeal.

This dashboard is optimized for appeal tracking rather than heavy account management.

### 9.3 Deputy dashboard
Component: `DeputyDashboard.tsx`

Main functions:
- highlight work queue,
- show operational stats,
- search/filter by category/status,
- expose tabs like urgent/unanswered,
- show citizen and district context,
- prioritize quick movement into appeal detail pages.

This is a workbench-style interface.

### 9.4 Admin dashboard
Component: `AdminDashboard.tsx`

Main functions:
- high-level platform metrics,
- user and appeal totals,
- quick navigation to appeals/users/analytics,
- simplified system status indicators.

This is a control/monitoring dashboard rather than a transaction-heavy screen.

---

## 10. Citizen-through-Telegram model on the frontend

The citizen side is unusual compared to standard web apps.

The citizen web UI is effectively intended to run inside Telegram WebApp:
1. Telegram opens web app,
2. frontend loads Telegram script,
3. frontend extracts Telegram init data,
4. backend verifies Telegram identity,
5. auth token is issued dynamically,
6. route guard admits citizen into the UI.

This means the browser app is acting as an extension of the Telegram environment, not a separate independent citizen portal.

---

## 11. Realtime/WebSocket intent

Files:
- `src/lib/api/websocket.ts`
- `src/lib/hooks/useWebSocket.ts`

Intended design:
- open websocket with JWT token in query string,
- dispatch `ws-message` browser events,
- invalidate React Query caches on updates.

This is meant to support near-real-time notifications/chat refresh.

Current limitations in repo state:
- backend websocket runtime is not fully aligned,
- frontend websocket URL expectations are generic and may not match deployment,
- appeal subscription logic is shallow and mainly query-invalidation based.

---

## 12. i18n model

The app is locale-native rather than a single-language UI with translated labels.

Evidence:
- middleware-based locale routing,
- messages loaded per locale,
- translations stored in `src/locales/ru.json` and `src/locales/kz.json`.

This affects all page paths and navigation behavior.

---

## 13. Frontend architecture summary

The frontend is best described as:
- a role-aware Next.js application,
- backed almost entirely by backend APIs,
- optimized around dashboards and appeal tracking,
- with a Telegram-first citizen experience,
- and with early-stage realtime support scaffolding.
