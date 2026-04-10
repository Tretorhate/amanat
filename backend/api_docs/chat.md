# Chat & Messages API

## Base URL
```
/api/chat/
```

---

## GET `/api/chat/threads/`

List message threads for current user.

### Headers
```
Authorization: Bearer <access-token>
```

### Response (Success - 200 OK)
```json
[
  {
    "id": "uuid-string",
    "appeal": {
      "id": "uuid-string",
      "title": "Проблема с освещением"
    },
    "subject": "Проблема с освещением",
    "is_active": true,
    "created_at": "2026-01-17T10:30:00Z",
    "updated_at": "2026-01-17T12:15:00Z",
    "participants": [
      {
        "id": "uuid-string",
        "username": "alex_smith"
      },
      {
        "id": "uuid-string",
        "username": "ivan_petrov"
      }
    ],
    "unread_count": 1
  }
]
```

---

## GET `/api/chat/threads/{id}/`

Get specific message thread details.

### Headers
```
Authorization: Bearer <access-token>
```

### Response (Success - 200 OK)
```json
{
  "id": "uuid-string",
  "appeal": {
    "id": "uuid-string",
    "title": "Проблема с освещением"
  },
  "subject": "Проблема с освещением",
  "is_active": true,
  "created_at": "2026-01-17T10:30:00Z",
  "updated_at": "2026-01-17T12:15:00Z",
  "participants": [...],
  "messages": [
    {
      "id": "uuid-string",
      "sender": {
        "id": "uuid-string",
        "username": "ivan_petrov",
        "full_name": "Иван Петров"
      },
      "content": "Здравствуйте! Приняли ваше обращение в работу.",
      "sent_at": "2026-01-17T12:15:00Z",
      "is_read": true
    }
  ]
}
```

---

## GET `/api/chat/threads/{thread_id}/messages/`

List messages in a thread.

### Headers
```
Authorization: Bearer <access-token>
```

### Query Parameters
```
page: 1 (optional)
```

### Response (Success - 200 OK)
```json
{
  "count": 15,
  "next": "http://localhost:8000/api/chat/threads/uuid/messages/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid-string",
      "sender": {
        "id": "uuid-string",
        "username": "alex_smith",
        "full_name": "Алексей Смирнов"
      },
      "content": "Здравствуйте, коллега! Есть проблема с освещением.",
      "sent_at": "2026-01-17T10:30:00Z",
      "is_read": true
    }
  ]
}
```

---

## POST `/api/chat/threads/{thread_id}/messages/`

Send a message in thread.

### Headers
```
Authorization: Bearer <access-token>
Content-Type: application/json
```

### Request Body
```json
{
  "content": "Спасибо за информацию! Проверим в течение дня."
}
```

### Response (Success - 201 Created)
```json
{
  "id": "uuid-string",
  "sender": {
    "id": "uuid-string",
    "username": "ivan_petrov",
    "full_name": "Иван Петров"
  },
  "content": "Спасибо за информацию! Проверим в течение дня.",
  "sent_at": "2026-01-17T12:45:00Z",
  "is_read": false
}
```

---

## POST `/api/chat/threads/create-for-appeal/{appeal_id}/`

Create a message thread for an appeal.

### Headers
```
Authorization: Bearer <access-token>
```

### Response (Success - 201 Created)
```json
{
  "id": "uuid-string",
  "appeal": {
    "id": "uuid-string",
    "title": "Проблема с освещением"
  },
  "subject": "Проблема с освещением",
  "is_active": true,
  "created_at": "2026-01-17T10:30:00Z"
}
```

---

## POST `/api/chat/messages/{id}/mark-as-read/`

Mark a message as read.

### Headers
```
Authorization: Bearer <access-token>
```

### Response (Success - 200 OK)
```json
{
  "status": "Message marked as read"
}
```

---

## WebSocket Endpoint

### URL
```
ws://localhost:8000/ws/chat/thread/{thread_id}/
```

### Protocol
- Connects to specific message thread
- Receives real-time message notifications
- Requires authentication via JWT in query parameter or header

### Example Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/chat/thread/uuid-string/?token=your-jwt-token');

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  // Handle new message
};
```
