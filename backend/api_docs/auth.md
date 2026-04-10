# Authentication API

## Base URL
```
/api/auth/
```

---

## POST `/api/auth/login/`

Authenticate user and receive JWT tokens.

### Request Body
```json
{
  "username": "string",
  "password": "string"
}
```

### Response (Success - 200 OK)
```json
{
  "refresh": "refresh-token-string",
  "access": "access-token-string",
  "user": {
    "id": "uuid-string",
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "deputy",
    "is_active": true
  }
}
```

### Response (Error - 401 Unauthorized)
```json
{
  "detail": "No active account found with the given credentials"
}
```

---

## POST `/api/auth/logout/`

Logout user (blacklist refresh token).

### Headers
```
Authorization: Bearer <access-token>
```

### Request Body
```json
{
  "refresh": "refresh-token-string"
}
```

### Response (Success - 200 OK)
```json
{
  "detail": "Successfully logged out"
}
```

---

## POST `/api/auth/token/refresh/`

Refresh access token using refresh token.

### Request Body
```json
{
  "refresh": "refresh-token-string"
}
```

### Response (Success - 200 OK)
```json
{
  "access": "new-access-token-string"
}
```

---

## POST `/api/auth/password/change/`

Change user password.

### Headers
```
Authorization: Bearer <access-token>
```

### Request Body
```json
{
  "old_password": "current-password",
  "new_password": "new-password",
  "new_password_confirm": "new-password"
}
```

### Response (Success - 200 OK)
```json
{
  "detail": "Password changed successfully"
}
```
