# Amanat Platform API Documentation

This folder contains detailed API documentation for the Amanat platform backend.

## Endpoint Groups

1. [Authentication](./auth.md) - User login, logout, token refresh
2. [Citizens](./citizens.md) - Citizen registration and profile management
3. [Deputies](./deputies.md) - Deputy profiles and assignments
4. [Appeals](./appeals.md) - Appeal creation, management, and responses
5. [Chat/Messages](./chat.md) - Messaging between citizens and deputies
6. [Analytics](./analytics.md) - Platform statistics and reporting
7. [Notifications](./notifications.md) - System notifications and alerts

## Base URL
```
http://localhost:8000/api/
```

## Authentication
Most endpoints require JWT authentication via Bearer token:
```
Authorization: Bearer <your-jwt-token>
```

## Common Response Formats

### Success Response
```json
{
  "id": "uuid-string",
  "field1": "value1",
  "field2": "value2"
}
```

### Error Response
```json
{
  "error": "Error message description"
}
```

### Paginated Response
```json
{
  "count": 42,
  "next": "http://localhost:8000/api/appeals/?page=2",
  "previous": null,
  "results": [
    {...},
    {...}
  ]
}
```
