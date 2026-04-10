# Appeals API

## Base URL
```
/api/appeals/
```

---

## GET `/api/appeals/`

List appeals (filtered and paginated).

### Headers
```
Authorization: Bearer <access-token>
```

### Query Parameters
```
status: pending|in_progress|resolved|closed|rejected (optional)
category: infrastructure|safety|healthcare|education|environment|transport|housing|utilities|social_services|other (optional)
page: 1 (optional)
```

### Response (Success - 200 OK)
```json
{
  "count": 127,
  "next": "http://localhost:8000/api/appeals/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid-string",
      "title": "Проблема с освещением",
      "description": "На улице Темирязева нет освещения уже неделю",
      "category": "infrastructure",
      "status": "pending",
      "priority": "normal",
      "message_count": 0,
      "created_at": "2026-01-17T10:30:00Z",
      "responded_at": null,
      "closed_at": null,
      "citizen": {
        "id": "uuid-string",
        "full_name": "Алексей Смирнов"
      },
      "deputy": {
        "id": "uuid-string",
        "full_name": "Иван Петров"
      }
    }
  ]
}
```

---

## POST `/api/appeals/`

Create a new appeal (authenticated citizens only).

### Headers
```
Authorization: Bearer <access-token>
Content-Type: application/json
```

### Request Body
```json
{
  "title": "Проблема с освещением на улице Темирязева",
  "description": "На улице Темирязева между домами 45 и 47 нет освещения уже неделю. Очень неудобно ходить вечером.",
  "category": "infrastructure"
}
```

### Response (Success - 201 Created)
```json
{
  "id": "uuid-string",
  "title": "Проблема с освещением на улице Темирязева",
  "description": "На улице Темирязева между домами 45 и 47 нет освещения уже неделю...",
  "category": "infrastructure",
  "status": "pending",
  "priority": "normal",
  "message_count": 0,
  "created_at": "2026-01-17T10:30:00Z",
  "responded_at": null,
  "closed_at": null
}
```

---

## GET `/api/appeals/{id}/`

Get detailed appeal information.

### Headers
```
Authorization: Bearer <access-token>
```

### Response (Success - 200 OK)
```json
{
  "id": "uuid-string",
  "title": "Проблема с освещением",
  "description": "На улице Темирязева нет освещения уже неделю",
  "category": "infrastructure",
  "status": "in_progress",
  "priority": "normal",
  "message_count": 2,
  "created_at": "2026-01-17T10:30:00Z",
  "responded_at": "2026-01-17T12:15:00Z",
  "closed_at": null,
  "satisfaction_rating": null,
  "citizen": {
    "id": "uuid-string",
    "full_name": "Алексей Смирнов",
    "phone": "+77011112233",
    "district": "Алатау"
  },
  "deputy": {
    "id": "uuid-string",
    "full_name": "Иван Петров",
    "phone": "+77011234567",
    "district": "Алатау"
  },
  "messages": [
    {
      "id": "uuid-string",
      "sender_type": "deputy",
      "sender_id": "uuid-string",
      "content": "Здравствуйте! Приняли ваше обращение в работу. Проверим ситуацию в течение 3 дней.",
      "created_at": "2026-01-17T12:15:00Z"
    }
  ]
}
```

---

## PATCH `/api/appeals/{id}/`

Partially update appeal (deputies/admins only).

### Headers
```
Authorization: Bearer <access-token>
```

### Request Body
```json
{
  "title": "Обновленный заголовок",
  "description": "Обновленное описание"
}
```

### Response (Success - 200 OK)
```json
{
  "id": "uuid-string",
  "title": "Обновленный заголовок",
  "description": "Обновленное описание",
  "category": "infrastructure",
  "status": "pending",
  "priority": "normal",
  "message_count": 0,
  "created_at": "2026-01-17T10:30:00Z"
}
```

---

## POST `/api/appeals/{id}/update_status/`

Update appeal status (deputies/admins only).

### Headers
```
Authorization: Bearer <access-token>
```

### Request Body
```json
{
  "status": "in_progress"
}
```

### Response (Success - 200 OK)
```json
{
  "id": "uuid-string",
  "status": "in_progress",
  "responded_at": "2026-01-17T12:15:00Z"
}
```

---

## POST `/api/appeals/{id}/add_message/`

Add a message to appeal (deputies/citizens).

### Headers
```
Authorization: Bearer <access-token>
```

### Request Body
```json
{
  "content": "Спасибо за оперативную реакцию!"
}
```

### Response (Success - 200 OK)
```json
{
  "id": "uuid-string",
  "content": "Спасибо за оперативную реакцию!",
  "created_at": "2026-01-17T14:30:00Z"
}
```

---

## POST `/api/appeals/{id}/respond/`

Deputy responds to appeal: update status AND/OR send message.

### Headers
```
Authorization: Bearer <access-token>
```

### Request Body (Status Only)
```json
{
  "status": "in_progress"
}
```

### Request Body (Message Only)
```json
{
  "message": "Приняли в работу, проверим в течение 3 дней"
}
```

### Request Body (Both)
```json
{
  "status": "resolved",
  "message": "Проблема решена! Установили новые фонари."
}
```

### Response (Success - 200 OK)
```json
{
  "success": true,
  "appeal": {
    "id": "uuid-string",
    "status": "resolved",
    "message_count": 3,
    "responded_at": "2026-01-17T12:15:00Z",
    "closed_at": "2026-01-17T15:45:00Z"
  },
  "message": {
    "id": "uuid-string",
    "content": "Проблема решена! Установили новые фонари.",
    "created_at": "2026-01-17T15:45:00Z"
  },
  "notifications_sent": ["status_change", "new_message"]
}
```

---

## GET `/api/appeals/my_appeals/`

Get current citizen's appeals.

### Headers
```
Authorization: Bearer <access-token>
```

### Response (Success - 200 OK)
```json
[
  {
    "id": "uuid-string",
    "title": "Проблема с освещением",
    "description": "На улице Темирязева нет освещения",
    "category": "infrastructure",
    "status": "in_progress",
    "priority": "normal",
    "message_count": 2,
    "created_at": "2026-01-17T10:30:00Z",
    "deputy": {
      "id": "uuid-string",
      "full_name": "Иван Петров"
    }
  }
]
```

---

## POST `/api/appeals/create/`

Create appeal via Telegram bot (public endpoint).

### Request Body
```json
{
  "telegram_user_id": 123456789,
  "description": "На улице Темирязева нет освещения уже неделю"
}
```

### Response (Success - 201 Created)
```json
{
  "id": "uuid-string",
  "category": "infrastructure",
  "status": "pending",
  "created_at": "2026-01-17T10:30:00Z",
  "message_count": 0
}
```

---

## GET `/api/appeals/my-appeals/`

Get citizen's appeals via Telegram (public endpoint).

### Query Parameters
```
telegram_user_id (integer, required)
```

### Response (Success - 200 OK)
```json
[
  {
    "id": "uuid-string",
    "description": "На улице Темирязева нет освещения",
    "category": "infrastructure",
    "status": "in_progress",
    "message_count": 2,
    "created_at": "2026-01-17T10:30:00Z"
  }
]
```
