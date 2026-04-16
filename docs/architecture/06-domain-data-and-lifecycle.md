# Domain Data and Lifecycle Analysis

## 1. Core business entities

The system revolves around a small set of connected entities.

### User
Base identity used for auth and permissions.

### Citizen
Citizen-specific profile and Telegram linkage.

### Deputy
Deputy-specific profile, constituency, and Telegram linkage.

### Constituency
Geographic/political grouping used to match citizens and deputies.

### Appeal
Primary transactional object representing a citizen request/problem.

### AppealMessage / Message
Two overlapping message models used for dialog around an appeal.

### Notification
Persisted alert record for user-facing communication.

### Analytics records
Precomputed or saved reporting objects.

---

## 2. Citizen lifecycle

### 2.1 Preregistration-oriented lifecycle
A common intended path appears to be:
1. admin bulk imports citizens from CSV,
2. user and citizen profile are created,
3. constituency is assigned,
4. deputy may be assigned by constituency or fallback,
5. later the citizen appears in Telegram and links by phone/Telegram id.

### 2.2 Self-registration lifecycle
There is also web self-registration:
1. user fills registration form,
2. backend creates `User` with forced `citizen` type,
3. backend creates `Citizen` profile,
4. backend assigns random active deputy.

This means the repository supports both:
- operational/admin-led onboarding,
- direct user self-signup.

---

## 3. Deputy lifecycle

Typical deputy lifecycle:
1. admin creates/imports deputy user,
2. backend creates `Deputy` profile,
3. deputy may get constituency and specializations,
4. deputy logs in on web,
5. deputy may link Telegram account,
6. deputy begins receiving appeals and notifications.

Deputies are central to assignment and resolution.

---

## 4. Appeal lifecycle in detail

## 4.1 Appeal creation prerequisites
For a successful appeal the system typically expects:
- citizen identity exists,
- citizen has phone,
- citizen has constituency or assigned deputy,
- at least one active deputy exists,
- optional OpenAI categorization available.

## 4.2 Creation path
When appeal is created:
1. citizen submits description,
2. deputy is resolved by constituency or fallback,
3. AI attempts category/priority classification,
4. appeal row is inserted,
5. status starts as `pending`,
6. Telegram notification may be sent to deputy.

## 4.3 Working phase
During active handling:
- deputy may send messages,
- citizen may reply,
- status may move to `in_progress`,
- message count increases,
- read-state and message visibility may be tracked.

## 4.4 Finalization phase
Appeal can end as:
- `resolved`
- `closed`
- `rejected`

Additional effects:
- `closed_at` may be set,
- citizen-visible system message may be created,
- citizen may receive Telegram notification,
- analytics may later consume these timestamps.

---

## 5. Deputy assignment lifecycle

Deputy selection is not random first; it is constituency-driven first.

Preferred assignment order in main appeal creation flow:
1. active deputy in citizen’s constituency,
2. citizen’s `assigned_deputy` if active,
3. random active deputy,
4. otherwise fail.

This means constituency is the primary routing signal, with explicit backup paths.

---

## 6. AI categorization lifecycle

On appeal creation:
1. description text is sent to `OpenAIService`,
2. service returns category and priority,
3. if service fails, backend logs warning,
4. backend continues with defaults.

This makes AI advisory, not mandatory.

That is architecturally important because it prevents AI outage from stopping appeal intake.

---

## 7. Messaging lifecycle

The platform effectively implements a hybrid messaging model.

### 7.1 AppealMessage lifecycle
Usually used for business-visible dialog on the appeal detail page.

Flow:
1. deputy or citizen sends text,
2. `AppealMessage` row created,
3. message can be shown in appeal dialogue UI,
4. citizen visibility can be controlled,
5. system messages can also be stored here.

### 7.2 Chat Message lifecycle
Usually used for channel/source-specific communication state.

Flow:
1. message row stores sender, receiver, channel (`web` or `telegram`),
2. message can be marked read,
3. notifications/read receipts may be built around it.

### 7.3 Combined lifecycle in actual code
For some send paths, backend creates both records:
- `AppealMessage`
- `chat.Message`

So one logical human message may be persisted twice in different schemas for different purposes.

---

## 8. Message limit lifecycle

The platform enforces a cap using `APPEAL_MESSAGE_LIMIT` (default 10).

Used in:
- deputy send-message actions,
- citizen Telegram reply flow,
- bot help/UX messaging,
- appeal response logic.

This acts as a guardrail on unbounded dialog per appeal.

---

## 9. Citizen-reply detection lifecycle

The system tries to detect when a citizen is allowed to answer by checking:
- active appeal statuses (`pending`, `in_progress`, `resolved` in some code),
- current message count < limit,
- last message sender is deputy.

This is conceptually a state machine:
1. deputy sends message,
2. appeal becomes “awaiting citizen reply”,
3. citizen replies once or until limit is reached,
4. cycle continues or appeal is finalized.

---

## 10. Notification lifecycle

There are two notification lifecycles.

### 10.1 Direct Telegram notification lifecycle
1. business event occurs,
2. backend directly calls `TelegramService`,
3. external bot API is hit,
4. no formal queue required.

### 10.2 Persisted notification lifecycle
1. `Notification` row created,
2. preferences checked,
3. send function chosen by type,
4. status becomes `sent` or `failed`,
5. async task may be used.

The direct Telegram path is currently the more central operational path for appeals.

---

## 11. Analytics lifecycle

Analytics data comes from two sources.

### 11.1 Live aggregation
Many endpoints directly aggregate current DB data from `Appeal`, `UserActivityLog`, etc.

### 11.2 Precomputed/persisted analytics
`AppealAnalytics` stores values like:
- resolution time hours,
- satisfaction score,
- reopened count,
- interaction count.

The analytics endpoints combine both stored and live-computed values.

---

## 12. Data ownership summary

### Frontend owns
- temporary UI state,
- auth token persistence,
- filters/search/pagination state.

### Bot owns
- transient conversation state only.

### Backend owns
- all business truth,
- all workflow status,
- all entity relationships,
- all notifications and analytics records.

### Database owns
- durable persistence of backend state.

---

## 13. Domain summary

The domain is fundamentally an **appeal workflow system** with:
- identity and geography,
- role-based handling,
- Telegram-assisted intake and follow-up,
- optional AI classification,
- light analytics and notification layers around the transaction core.
