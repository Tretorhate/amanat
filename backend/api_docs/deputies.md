# Deputies API

## Base URL
```
/api/deputies/
```

---

## GET `/api/deputies/`

List all active deputies (public endpoint).

### Response (Success - 200 OK)
```json
[
  {
    "id": "uuid-string",
    "full_name": "Иван Петров",
    "district": "Алатау",
    "phone": "+77011234567",
    "email": "ivan@example.com",
    "bio": "Депутат округа Алатау",
    "is_active": true,
    "telegram_chat_id": 987654321
  }
]
```

---

## GET `/api/deputies/{id}/`

Get specific deputy profile (public endpoint).

### Response (Success - 200 OK)
```json
{
  "id": "uuid-string",
  "full_name": "Иван Петров",
  "district": "Алатау",
  "phone": "+77011234567",
  "email": "ivan@example.com",
  "bio": "Депутат округа Алатау",
  "is_active": true,
  "telegram_chat_id": 987654321,
  "stats": {
    "total_appeals": 42,
    "resolved_appeals": 38,
    "avg_response_time_hours": 12.5
  }
}
```

---

## GET `/api/deputies/me/`

Get current authenticated deputy's profile.

### Headers
```
Authorization: Bearer <access-token>
```

### Response (Success - 200 OK)
```json
{
  "id": "uuid-string",
  "full_name": "Иван Петров",
  "district": "Алатау",
  "phone": "+77011234567",
  "email": "ivan@example.com",
  "bio": "Депутат округа Алатау",
  "is_active": true,
  "telegram_chat_id": 987654321,
  "user": {
    "id": "uuid-string",
    "username": "ivan_petrov",
    "email": "ivan@example.com"
  }
}
```

---

## PATCH `/api/deputies/me/`

Update current deputy's profile.

### Headers
```
Authorization: Bearer <access-token>
```

### Request Body
```json
{
  "full_name": "Иван Иванович Петров",
  "phone": "+77019876543",
  "email": "ivan.new@example.com",
  "bio": "Главный депутат округа Алатау",
  "district": "Алатау"
}
```

### Response (Success - 200 OK)
```json
{
  "id": "uuid-string",
  "full_name": "Иван Иванович Петров",
  "district": "Алатау",
  "phone": "+77019876543",
  "email": "ivan.new@example.com",
  "bio": "Главный депутат округа Алатау",
  "is_active": true,
  "telegram_chat_id": 987654321
}
```

---

## GET `/api/deputies/me/stats/`

Get deputy's performance statistics.

### Headers
```
Authorization: Bearer <access-token>
```

### Response (Success - 200 OK)
```json
{
  "total_appeals": 127,
  "pending_appeals": 5,
  "in_progress_appeals": 12,
  "resolved_appeals": 98,
  "rejected_appeals": 2,
  "closed_appeals": 10,
  "avg_response_time_hours": 8.3,
  "resolution_rate_percent": 92.1,
  "satisfaction_avg": 4.7
}
```

---

## GET `/api/deputies/me/appeals/`

List appeals assigned to current deputy.

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
  "count": 42,
  "next": "http://localhost:8000/api/deputies/me/appeals/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid-string",
      "title": "Проблема с освещением",
      "description": "На улице Темирязева нет освещения уже неделю",
      "category": "infrastructure",
      "status": "in_progress",
      "priority": "normal",
      "message_count": 3,
      "created_at": "2026-01-17T10:30:00Z",
      "responded_at": "2026-01-17T12:15:00Z",
      "closed_at": null,
      "citizen": {
        "id": "uuid-string",
        "full_name": "Алексей Смирнов",
        "phone": "+77011112233"
      }
    }
  ]
}
```
