# Notifications API

## Base URL
```
/api/notifications/
```

---

## GET `/api/notifications/`

List user's notifications.

### Headers
```
Authorization: Bearer <access-token>
```

### Query Parameters
```
is_read: true|false (optional)
limit: 20 (optional)
```

### Response (Success - 200 OK)
```json
[
  {
    "id": "uuid-string",
    "title": "Новое обращение назначено",
    "message": "Вам назначено новое обращение от Алексея Смирнова",
    "type": "appeal_assigned",
    "is_read": false,
    "created_at": "2026-01-17T12:30:00Z",
    "related_object_id": "uuid-string",
    "related_object_type": "appeal"
  }
]
```

---

## POST `/api/notifications/{id}/mark-as-read/`

Mark notification as read.

### Headers
```
Authorization: Bearer <access-token>
```

### Response (Success - 200 OK)
```json
{
  "status": "Notification marked as read"
}
```

---

## POST `/api/notifications/mark-all-as-read/`

Mark all notifications as read.

### Headers
```
Authorization: Bearer <access-token>
```

### Response (Success - 200 OK)
```json
{
  "status": "All notifications marked as read"
}
```

---

## DELETE `/api/notifications/{id}/`

Delete a notification.

### Headers
```
Authorization: Bearer <access-token>
```

### Response (Success - 204 No Content)
```
// Empty response
```

---

## GET `/api/notifications/unread-count/`

Get count of unread notifications.

### Headers
```
Authorization: Bearer <access-token>
```

### Response (Success - 200 OK)
```json
{
  "unread_count": 5
}
```

---

## WebSocket Notifications Endpoint

### URL
```
ws://localhost:8000/ws/notifications/
```

### Description
Real-time notification stream for authenticated user.

### Example Usage
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/notifications/?token=your-jwt-token');

ws.onmessage = function(event) {
  const notification = JSON.parse(event.data);
  // Handle incoming notification
  console.log('New notification:', notification);
};

// Example notification message:
{
  "type": "notification",
  "data": {
    "id": "uuid-string",
    "title": "Новый ответ на обращение",
    "message": "Депутат ответил на ваше обращение",
    "type": "appeal_response",
    "created_at": "2026-01-17T14:30:00Z"
  }
}
```
