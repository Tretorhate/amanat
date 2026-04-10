# Amanat Citizen Platform — Deployment Guide

## Prerequisites

- Docker 24+ and Docker Compose v2+
- Git
- Nginx on the host server (to proxy traffic to containers)
- 2 GB RAM minimum (4 GB recommended)

---

## Quick Start

```bash
# 1. Clone the repository
git clone <repo-url> amanat
cd amanat

# 2. Configure environment
cp .env.example .env
# Edit .env — fill in all CHANGE_ME values (see Environment Variables below)

# 3. Build and start all services
docker compose up -d --build
```

The first run will:
- Start PostgreSQL and Redis
- Run Django migrations automatically
- Collect static files
- Create the system deputy account
- Start all application services

To seed data, execute the following command:

```bash
docker exec amanat-backend python manage.py create_test_users
```

Then configure host nginx to proxy traffic (see [Nginx Configuration](#nginx-configuration) below).

---

## Environment Variables

Edit `.env` before starting. All `CHANGE_ME` values must be replaced.

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_DB` | Yes | Database name |
| `POSTGRES_USER` | Yes | Database user |
| `POSTGRES_PASSWORD` | **CHANGE** | Database password |
| `DATABASE_URL` | Yes | Full PostgreSQL connection URL (must match above) |
| `REDIS_PASSWORD` | **CHANGE** | Redis password |
| `REDIS_URL` | Yes | Redis URL for channel layer (must include password) |
| `REDIS_CACHE_URL` | Yes | Redis URL for Django cache |
| `CELERY_BROKER_URL` | Yes | Redis URL for Celery broker |
| `CELERY_RESULT_BACKEND` | Yes | Redis URL for Celery results |
| `SECRET_KEY` | **CHANGE** | Django secret key — generate with: `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `DEBUG` | Yes | Must be `False` in production |
| `ALLOWED_HOSTS` | Yes | Comma-separated: `your-domain.com,localhost` |
| `NEXT_PUBLIC_API_URL` | Yes | Public API URL: `https://your-domain.com/api` |
| `OPENAI_API_KEY` | Optional | Required for AI appeal categorization |
| `TELEGRAM_BOT_TOKEN` | Optional | Required for Telegram bot functionality |
| `EMAIL_HOST` | Optional | SMTP host for email notifications |

---

## Services

| Container | Role | Exposed Port |
|-----------|------|--------------|
| `amanat-backend` | Django API + WebSockets (Daphne ASGI) | `127.0.0.1:8011` |
| `amanat-frontend` | Next.js UI | `127.0.0.1:3011` |
| `amanat-celery` | Background tasks + scheduled jobs | — |
| `amanat-postgres` | PostgreSQL 15 database | internal only |
| `amanat-redis` | Redis 7 (broker + cache + channel layer) | internal only |
| `amanat-telegram-bot` | Telegram bot | — |

Backend runs Daphne (ASGI), which handles both HTTP REST and WebSocket connections through a single port. Celery uses the `-B` flag to run the beat scheduler in the same process.

---

## Nginx Configuration

Create a new site config at `/etc/nginx/sites-available/amanat`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 20M;

    # API, admin, and WebSocket → backend container (Daphne)
    location ~ ^/(api|admin|ws)/ {
        proxy_pass http://127.0.0.1:8011;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket upgrade support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400s;
    }

    # Static files — served directly from Docker volume
    # Replace with Mountpoint from: docker volume inspect amanat_static_files
    location /static/ {
        alias /var/lib/docker/volumes/amanat_static_files/_data/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media files — served directly from Docker volume
    # Replace with Mountpoint from: docker volume inspect amanat_media_files
    location /media/ {
        alias /var/lib/docker/volumes/amanat_media_files/_data/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Frontend → Next.js container
    location / {
        proxy_pass http://127.0.0.1:3011;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then enable it:

```bash
sudo ln -s /etc/nginx/sites-available/amanat /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Finding Docker volume paths

Get the actual mount paths for static/media volumes:

```bash
docker volume inspect amanat_static_files | grep Mountpoint
docker volume inspect amanat_media_files  | grep Mountpoint
```

Update the `alias` directives in the nginx config with these paths (typically `/var/lib/docker/volumes/amanat_static_files/_data/`).

### SSL / HTTPS

Configure SSL in your existing nginx setup. With Certbot:

```bash
sudo certbot --nginx -d your-domain.com
```

---

## Common Operations

### View logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f celery
```

### Check service health

```bash
docker compose ps
```

### Restart a service

```bash
docker compose restart backend
```

### Run a Django management command

```bash
docker exec amanat-backend python manage.py <command>

# Examples:
docker exec amanat-backend python manage.py createsuperuser
docker exec amanat-backend python manage.py shell
docker exec amanat-backend python manage.py seed_data
```

### Deploy an update

```bash
git pull
docker compose up -d --build
```

Migrations run automatically on container start.

### Stop all services

```bash
docker compose down
```

### Stop and remove all data (destructive)

```bash
docker compose down -v
```

---

## Database

### Backup

```bash
docker exec amanat-postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore

```bash
docker exec -i amanat-postgres psql -U $POSTGRES_USER $POSTGRES_DB < backup.sql
```

### Access the database directly

```bash
docker exec -it amanat-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB
```

---

## Scheduled Tasks

Celery Beat runs inside the worker container (`-B` flag) and executes these tasks automatically:

| Task | Schedule |
|------|----------|
| Auto-close resolved appeals (after 7 days) | Daily at 02:00 |
| Send daily summary to deputies | Daily at 09:00 |
| Send reminder notifications for pending appeals | Daily at 10:00 |
| Clean up notifications older than 90 days | Every Sunday at 03:00 |

All times are in Asia/Almaty timezone (UTC+5).

---

## Troubleshooting

**Backend fails to start — migration errors**
- Check logs: `docker compose logs backend`
- Verify `DATABASE_URL` in `.env` matches `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB`

**`SECRET_KEY` error on startup**
- Ensure `SECRET_KEY` is set and non-empty in `.env`

**WebSockets not connecting**
- Confirm nginx config has `proxy_http_version 1.1` and `Upgrade`/`Connection` headers for `/ws/` locations
- Check: `docker compose logs backend`

**Frontend shows API errors**
- `NEXT_PUBLIC_API_URL` is baked in at build time — after changing it, rebuild: `docker compose up -d --build frontend`

**Celery tasks not running**
- Check Redis is healthy: `docker exec amanat-redis redis-cli -a $REDIS_PASSWORD ping`
- Check: `docker compose logs celery`

**Static files return 404 via nginx**
- Confirm the `alias` path in nginx config matches the `Mountpoint` from `docker volume inspect amanat_static_files`
- Run collectstatic manually: `docker exec amanat-backend python manage.py collectstatic --noinput`
