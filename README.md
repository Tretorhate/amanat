# Amanat Citizen Platform

Digital platform connecting citizens with their assigned deputies through appeals management. Features AI-powered categorization, real-time messaging, and comprehensive analytics dashboards.

## Repository Structure

```
amanat-citizen-platform/
├── backend/                 # Django REST API server
├── frontend/               # React web application
├── telegram-bot/           # Telegram Bot service (Python)
├── shared/                 # Shared utilities and constants
├── infrastructure/         # Docker, deployment configs
└── docs/                   # Documentation
```

## Main Components

### Backend Repository (Django)
Path: `/backend`

Django REST Framework API server handling all business logic, database operations, and integrations.

**Tech Stack:**
- Python 3.11+
- Django 5.0+
- Django REST Framework
- PostgreSQL with Django ORM
- Redis for caching and Celery tasks
- Django Channels (WebSockets)
- OpenAI API integration
- JWT authentication (djangorestframework-simplejwt)
- Celery for background tasks

### Frontend Repository (React)
Path: `/frontend`

React web application for citizens and deputies to interact with the platform.

**Tech Stack:**
- React 18+
- TypeScript
- Redux Toolkit
- React Router
- Material UI or Tailwind CSS
- Axios for API calls
- Socket.io-client for WebSocket connections

### Telegram Bot
Path: `/telegram-bot`

Python-based Telegram bot for notifications and simple interactions.

**Tech Stack:**
- Python 3.11+
- python-telegram-bot
- Requests library
- Integration with backend API

## Quick Start

### Local development with Docker

The easiest way to run the whole project locally is from the repository root:

```bash
cp .env.example .env
docker compose up --build
```

Open:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/api/docs/`

Stop everything:

```bash
docker compose down
```

Run with Telegram bot too:

```bash
docker compose --profile bot up --build
```

Useful commands:

```bash
docker compose logs -f
docker compose exec backend python manage.py createsuperuser
docker compose exec backend pytest
```

For the full local-container workflow, see:
- `docs/architecture/08-development-workflow.md`
- `deploy/README.md`

### Service-level host/hybrid setup

If you want to run services directly on your host instead of fully in Docker, env examples are available here:
- `backend/.env.example`
- `frontend/.env.example`
- `telegram_bot/.env.example`

## Features

- **Citizen Management**: Registration, profiles, document management
- **Deputy Management**: Deputy profiles, constituencies, specializations
- **Appeals System**: Submit, track, and manage appeals with AI categorization
- **Real-time Messaging**: WebSocket-based messaging between citizens and deputies
- **Analytics Dashboard**: Comprehensive reporting and analytics
- **Notifications**: Multi-channel notifications (email, push, SMS, in-app)
- **AI Integration**: OpenAI integration for appeal categorization and assistance

## Architecture

The platform follows a microservices architecture with the backend serving as the central API hub connecting all components:

```
[Frontend] ←→ [Backend API] ←→ [Telegram Bot]
                  ↕
            [Database & Cache]
                  ↕
         [Background Workers]
```

## Deployment

Deployment configurations are located in the `infrastructure/` directory, including Docker files and Kubernetes manifests.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.