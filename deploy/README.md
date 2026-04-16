# Digital Deputat Deployment

This directory contains the configuration and scripts for both local development and production deployment of the Digital Deputat platform.

## Development

For local development, use:
- `docker-compose.dev.yml`
- `.env.dev` (copy from `.env.dev.example`)

Quick start:

Preferred root-level local workflow:

```bash
cp .env.example .env
docker compose up --build
```

Explicit deploy-scoped equivalent:

```bash
cp deploy/.env.dev.example deploy/.env.dev
docker compose --env-file deploy/.env.dev -f deploy/docker-compose.dev.yml up --build
```

Optional service-level env examples also exist for host-run workflows:
- `backend/.env.example`
- `frontend/.env.example`
- `telegram_bot/.env.example`

Optional Telegram bot in dev:

```bash
docker compose --env-file deploy/.env.dev -f deploy/docker-compose.dev.yml --profile bot up --build
```

See also:
- `docs/architecture/08-development-workflow.md`

## Production

## Architecture

```
Internet
   |
   |  digital-deputat.birqadam.kz
   v
[ Frontend :3011 ]
   |
   v
[ Backend :8011 ]
   |
   v
[ shared-postgres :5432 ]
```

Telegram Bot → communicates directly with Backend via internal network.

## Prerequisites

1. Existing PostgreSQL container named `shared-postgres`
2. Shared Docker network named `shared_network`
3. Docker and Docker Compose installed

## Setup Instructions

### 1. Prepare PostgreSQL Database

Run the setup script to create the database and connect to the network:

**On Linux/macOS:**
```bash
chmod +x setup_postgres.sh
./setup_postgres.sh
```

**On Windows:**
```powershell
./setup_postgres.ps1
```

### 2. Environment Variables

Update the `docker-compose.prod.yml` file with your actual values:

- `BOT_TOKEN`: Your Telegram bot token
- Adjust any other sensitive values as needed

### 3. Deploy Services

Build and start all services:

```bash
docker-compose -f deploy/docker-compose.prod.yml up -d --build
```

## Services

- **Backend**: Runs on port 8011 internally (exposed to localhost only)
- **Frontend**: Runs on port 3011 internally (exposed to localhost only)  
- **Telegram Bot**: No exposed ports, communicates internally with backend

## Configuration

### Ports
- Backend: 127.0.0.1:8011 (mapped from container port 8000)
- Frontend: 127.0.0.1:3011 (mapped from container port 3000)

### Network
All services run on the external network `shared_network`.

### Database
Uses existing `shared-postgres` container with newly created `digital_deputat_db` database.

## Environment Variables

### Backend Service
- `ENV=production`
- `DATABASE_URL=postgresql://postgres:StrongPassword@shared-postgres:5432/digital_deputat_db`
- `SECRET_KEY=super_secure_secret_key_digital_deputat_2026`
- `HOST=0.0.0.0`
- `PORT=8000`
- `DEBUG=False`
- `ALLOWED_HOSTS=digital-deputat.birqadam.kz,localhost,127.0.0.1`

### Frontend Service
- `NODE_ENV=production`
- `PORT=3000`
- `HOSTNAME=0.0.0.0`
- `NEXT_PUBLIC_API_URL=https://digital-deputat.birqadam.kz`
- `INTERNAL_API_URL=http://digital-deputat-backend:8000`

### Telegram Bot Service
- `ENV=production`
- `BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN` (replace with actual token)
- `API_BASE_URL=http://digital-deputat-backend:8000`
- `DATABASE_URL=postgresql://postgres:StrongPassword@shared-postgres:5432/digital_deputat_db`

## SSL/TLS

Configure your reverse proxy/load balancer to handle SSL termination and forward requests to the frontend service.

## Monitoring

Monitor service health with:
```bash
docker-compose -f deploy/docker-compose.prod.yml ps
```

View logs with:
```bash
docker-compose -f deploy/docker-compose.prod.yml logs -f <service_name>
```