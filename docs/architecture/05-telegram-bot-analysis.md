# Telegram Bot Analysis

## 1. Bot role

The Telegram bot is the conversational citizen interface for the platform.

It is not a standalone business system. It acts as a thin adapter over backend APIs and relies on the backend for:
- identity validation,
- citizen registration/linking,
- appeal creation,
- appeal retrieval,
- deputy-response routing.

---

## 2. Runtime model

File: `telegram_bot/bot.py`

The bot:
- loads env variables,
- starts a polling-based Telegram application,
- handles commands and text/contact messages,
- calls backend over HTTP using `requests`.

Important env vars:
- `TELEGRAM_BOT_TOKEN`
- `API_BASE_URL` (defaults to backend service DNS in Docker)

This makes the bot a network client of both:
- Telegram Bot API,
- backend HTTP API.

---

## 3. Conversation states

Defined states:
- `WAITING_FOR_PHONE`
- `WAITING_FOR_APPEAL_DESCRIPTION`

These support a guided appeal-creation flow.

---

## 4. Backend helper calls used by the bot

### `check_citizen_exists(telegram_user_id)`
Calls backend:
- `GET /citizens/check/`

Purpose:
- determine whether user exists,
- determine whether user has phone,
- determine whether bot should request contact info.

### `register_citizen(...)`
Calls backend:
- `POST /citizens/register/`

Purpose:
- create/update Telegram linkage,
- store contact info,
- attach preregistered citizen or deputy to Telegram identifiers.

### `create_appeal(...)`
Calls backend:
- `POST /appeals/create/`

Purpose:
- create a citizen appeal from bot chat.

### `get_my_appeals(...)`
Calls backend:
- `GET /appeals/my-appeals/`

Purpose:
- show user’s recent appeals.

### `send_message_to_deputy(...)`
Calls backend:
- `POST /chat/send_message_to_deputy/`

Purpose:
- send a citizen text reply back into an active appeal dialog.

---

## 5. `/start` flow

Handler: `start_command`

Actual flow:
1. Telegram user sends `/start`,
2. bot immediately calls backend registration endpoint with Telegram user id/chat id/full name/username,
3. backend tries to match or create linkage,
4. bot sends welcome/help text.

Architecturally, `/start` is not just a greeting; it is a **registration handshake attempt**.

---

## 6. `/help` flow

Handler: `help_command`

This is static informational UX:
- explains `/appeal`,
- explains `/myappeals`,
- explains `/cancel`,
- reminds user of 10-message limit.

No backend interaction here.

---

## 7. `/myappeals` flow

Handler: `my_appeals_command`

Flow:
1. bot calls backend with Telegram user id,
2. backend returns up to 20 appeals,
3. bot formats first 10 into human-readable list,
4. each item shows status, short description, date, message count.

This is a read-only status-tracking command.

---

## 8. `/appeal` creation flow

This is the central bot workflow.

### Step 1: eligibility check
Handler: `appeal_start`

Flow:
1. bot calls `check_citizen_exists`,
2. if user absent or missing phone -> ask user to share contact,
3. if user present and has phone -> proceed to text description.

### Step 2: phone collection
Handler: `receive_phone`

Flow:
1. user shares Telegram contact,
2. bot verifies contact belongs to same Telegram user,
3. bot sends phone to backend registration endpoint,
4. if save succeeds, bot asks for appeal description,
5. if not, bot ends with error message.

### Step 3: appeal submission
Handler: `appeal_receive_description`

Flow:
1. bot receives text description,
2. sends temporary “processing / AI analyzing” message,
3. calls backend appeal-creation endpoint,
4. backend creates and categorizes appeal,
5. bot deletes temporary message,
6. bot returns formatted success summary with appeal id fragment, category, status.

This is a good example of the bot being purely orchestration/UI, while the backend performs real work.

---

## 9. Plain-text citizen response flow

Handler: `handle_citizen_response`

This is the bot’s attempt to support follow-up dialog after a deputy message.

Intended flow:
1. user sends plain text not starting with `/`,
2. bot asks backend which active appeal is awaiting citizen reply,
3. backend returns active appeal if last message came from deputy,
4. bot checks message limit,
5. bot posts the citizen’s reply to backend,
6. backend stores message and notifies deputy,
7. bot confirms send success.

Operationally this is meant to make the bot behave like a conversation continuation channel instead of requiring explicit appeal selection each time.

---

## 10. Strengths of the bot design

### Thin adapter architecture
The bot has little domain logic; backend owns the rules. That reduces duplication.

### Good Telegram-native UX for registration
The use of `request_contact=True` is appropriate for identity completion.

### Appeal creation is conversational and guided
The flow reduces friction for citizen intake.

### Supports status-checking and follow-up messaging
This keeps Telegram as an ongoing service channel, not only an intake form.

---

## 11. Architectural limitations

### Hard dependency on backend availability
Nearly every command requires backend response.

### No local durable queue
If backend is unavailable, the bot cannot buffer actions for later.

### Endpoint coupling is brittle
The bot hardcodes path structure. If backend paths change, bot breaks quickly.

### Citizen identity depends on preregistration model
A Telegram user cannot fully self-onboard unless already known by phone/record matching.

---

## 12. Bot architecture summary

The Telegram bot is best understood as:
- a citizen-facing conversational shell,
- powered almost entirely by backend REST endpoints,
- optimized for guided appeal submission,
- and intended to extend appeals into a chat-like follow-up channel.
