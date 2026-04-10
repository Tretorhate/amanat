# Analytics API

## Base URL
```
/api/analytics/
```

---

## GET `/api/analytics/appeal-statistics/`

Get overall appeal statistics.

### Response (Success - 200 OK)
```json
{
  "total_appeals": 1250,
  "resolved_appeals": 1125,
  "pending_appeals": 45,
  "average_resolution_time": 12.4,
  "resolution_rate": 90.0
}
```

### Authentication (Optional)
```
Authorization: Bearer <access-token>  // If authenticated, may return additional private stats
```

---

## GET `/api/analytics/appeal-trends/`

Get appeal trends over time.

### Query Parameters
```
days: 30 (optional, default=30)
```

### Response (Success - 200 OK)
```json
{
  "daily_counts": [
    {"date": "2026-01-11", "count": 12},
    {"date": "2026-01-12", "count": 18},
    {"date": "2026-01-13", "count": 15}
  ],
  "status_distribution": [
    {"status": "resolved", "count": 1125},
    {"status": "pending", "count": 45},
    {"status": "in_progress", "count": 80}
  ],
  "category_distribution": [
    {"category": "infrastructure", "count": 320},
    {"category": "housing", "count": 280},
    {"category": "utilities", "count": 210}
  ]
}
```

### Authentication (Optional)
```
Authorization: Bearer <access-token>  // If authenticated, may return additional private stats
```

---

## GET `/api/analytics/stats/recent/`

Get recent appeals (last 7 days).

### Query Parameters
```
days: 7 (optional, default=7)
limit: 20 (optional, default=20)
```

### Response (Success - 200 OK)
```json
[
  {
    "id": "uuid-string",
    "title": "Проблема с освещением",
    "description": "На улице Темирязева нет освещения",
    "category": "infrastructure",
    "status": "pending",
    "priority": "normal",
    "created_at": "2026-01-17T10:30:00Z",
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
```

### Authentication (Optional)
```
Authorization: Bearer <access-token>  // If authenticated, may return additional private stats
```

---

## GET `/api/analytics/detailed/`

Get detailed analytics with charts data.

### Response (Success - 200 OK)
```json
{
  "summary": {
    "total_appeals": 1250,
    "resolved_this_month": 95,
    "avg_resolution_time_days": 3.2,
    "citizen_satisfaction": 4.6
  },
  "trends": {
    "daily_appeals": [
      {"date": "2026-01-11", "count": 12},
      {"date": "2026-01-12", "count": 18},
      {"date": "2026-01-13", "count": 15},
      {"date": "2026-01-14", "count": 22},
      {"date": "2026-01-15", "count": 19},
      {"date": "2026-01-16", "count": 25},
      {"date": "2026-01-17", "count": 20}
    ],
    "category_distribution": [
      {"name": "Инфраструктура", "value": 320},
      {"name": "ЖКХ", "value": 280},
      {"name": "Коммунальные услуги", "value": 210},
      {"name": "Транспорт", "value": 180},
      {"name": "Здравоохранение", "value": 95}
    ],
    "status_distribution": [
      {"name": "Решено", "value": 1125},
      {"name": "В работе", "value": 80},
      {"name": "Ожидает", "value": 45}
    ]
  }
}
```

### Authentication (Optional)
```
Authorization: Bearer <access-token>  // If authenticated, may return additional private stats
```

---

## GET `/api/analytics/ai-detailed/`

Get AI-powered analytics with insights.

### Response (Success - 200 OK)
```json
{
  "platform_stats": {
    "total_appeals": 1250,
    "resolved_appeals": 1125,
    "active_users": 917,
    "avg_response_time_hours": 12.4
  },
  "insights": [
    "🔹 Пик активности приходится на вечерние часы (18:00-21:00)",
    "🔹 65% обращений касаются ЖКХ и инфраструктуры",
    "🔹 Среднее время решения составляет 3.2 дня",
    "🔹 Уровень удовлетворенности граждан - 4.6 из 5",
    "🔹 Рекомендуется увеличить персонал в отделе ЖКХ"
  ],
  "recommendations": [
    "⚡ Увеличить штат специалистов по ЖКХ на 2 человека",
    "⚡ Внедрить систему автоматического распределения обращений",
    "⚡ Провести тренинги для депутатов по эффективному взаимодействию",
    "⚡ Разработать мобильное приложение для удобства граждан"
  ]
}
```

### Authentication (Optional)
```
Authorization: Bearer <access-token>  // If authenticated, may return additional private stats
```

---

## GET `/api/analytics/deputy-performance/`

Get performance metrics for all deputies.

### Query Parameters
```
period: week|month|quarter (optional, default=month)
```

### Response (Success - 200 OK)
```json
[
  {
    "deputy": {
      "id": "uuid-string",
      "full_name": "Иван Петров",
      "district": "Алатау"
    },
    "metrics": {
      "total_appeals": 42,
      "resolved_appeals": 38,
      "pending_appeals": 2,
      "in_progress_appeals": 2,
      "avg_response_time_hours": 8.3,
      "resolution_rate_percent": 90.5,
      "satisfaction_avg": 4.7
    }
  }
]
```

### Authentication (Required)
```
Authorization: Bearer <access-token>  // Only authenticated users can view deputy performance
```
