# Citizens API

## Base URL
```
/api/citizens/
```

---

## GET `/api/citizens/check/`

Check if a Telegram user exists and has a phone number.

### Query Parameters
```
telegram_user_id (integer, required)
```

### Response (Success - 200 OK)
```json
{
  "exists": true,
  "has_phone": true,
  "citizen": {
    "id": "uuid-string",
    "full_name": "John Smith",
    "phone": "+77011234567"
  }
}
```

### Response (User Not Found - 200 OK)
```json
{
  "exists": false,
  "has_phone": false,
  "citizen": null
}
```

---

## POST `/api/citizens/register/`

Register or update a citizen via Telegram (public endpoint - no auth required).

### Request Body
```json
{
  "telegram_user_id": 123456789,
  "telegram_chat_id": 987654321,
  "full_name": "John Smith",
  "username": "johnsmith",
  "phone": "+77011234567"  // optional
}
```

### Response (Created - 201 Created)
```json
{
  "id": "uuid-string",
  "telegram_user_id": 123456789,
  "full_name": "John Smith",
  "phone": "+77011234567",
  "has_phone": true,
  "created": true
}
```

### Response (Updated - 200 OK)
```json
{
  "id": "uuid-string",
  "telegram_user_id": 123456789,
  "full_name": "John Smith",
  "phone": "+77011234567",
  "has_phone": true,
  "created": false
}
```

---

## GET `/api/citizens/`

Get current authenticated citizen's profile.

### Headers
```
Authorization: Bearer <access-token>
```

### Response (Success - 200 OK)
```json
{
  "id": "uuid-string",
  "full_name": "John Smith",
  "phone": "+77011234567",
  "address": "ул. Абая 123",
  "district": "Алатау",
  "telegram_user_id": 123456789,
  "telegram_chat_id": 987654321,
  "assigned_deputy": {
    "id": "uuid-string",
    "full_name": "Иван Петров",
    "district": "Алатау"
  },
  "created_at": "2026-01-17T10:30:00Z"
}
```

---

## PATCH `/api/citizens/`

Update current citizen's profile.

### Headers
```
Authorization: Bearer <access-token>
```

### Request Body
```json
{
  "full_name": "John Smith Jr.",
  "phone": "+77019876543",
  "address": "ул. Абая 456",
  "district": "Медеу"
}
```

### Response (Success - 200 OK)
```json
{
  "id": "uuid-string",
  "full_name": "John Smith Jr.",
  "phone": "+77019876543",
  "address": "ул. Абая 456",
  "district": "Медеу",
  "telegram_user_id": 123456789,
  "telegram_chat_id": 987654321,
  "assigned_deputy": {...},
  "created_at": "2026-01-17T10:30:00Z"
}
```

---

## GET `/api/citizens/documents/`

List citizen's documents.

### Headers
```
Authorization: Bearer <access-token>
```

### Response (Success - 200 OK)
```json
[
  {
    "id": "uuid-string",
    "document_type": "passport",
    "document_number": "I12345678",
    "issue_date": "2020-01-15",
    "expiry_date": "2030-01-15",
    "issued_by": "МЮ РК",
    "is_verified": true,
    "created_at": "2026-01-17T10:30:00Z"
  }
]
```

---

## POST `/api/citizens/documents/`

Upload a new document.

### Headers
```
Authorization: Bearer <access-token>
Content-Type: multipart/form-data
```

### Form Data
```
document_type: passport
document_number: I12345678
issue_date: 2020-01-15
expiry_date: 2030-01-15
issued_by: МЮ РК
file: <binary-file>
```

### Response (Success - 201 Created)
```json
{
  "id": "uuid-string",
  "document_type": "passport",
  "document_number": "I12345678",
  "issue_date": "2020-01-15",
  "expiry_date": "2030-01-15",
  "issued_by": "МЮ РК",
  "is_verified": false,
  "created_at": "2026-01-17T10:30:00Z"
}
```
