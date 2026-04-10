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

### Backend Setup
1. Navigate to the backend directory: `cd backend/`
2. Follow the setup instructions in the backend README

### Frontend Setup
1. Navigate to the frontend directory: `cd frontend/`
2. Install dependencies: `npm install`
3. Start the development server: `npm start`

### Telegram Bot Setup
1. Navigate to the telegram-bot directory: `cd telegram-bot/`
2. Install dependencies: `pip install -r requirements.txt`
3. Configure the bot token and start the bot

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