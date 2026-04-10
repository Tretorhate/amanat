# Amanat Backend

Digital platform connecting citizens with their assigned deputies through appeals management. Features AI-powered categorization, real-time messaging, and comprehensive analytics dashboards.

## Tech Stack

- Python 3.11+
- Django 5.0+
- Django REST Framework
- PostgreSQL with Django ORM
- Redis for caching and Celery tasks
- Django Channels (WebSockets)
- OpenAI API integration
- JWT authentication (djangorestframework-simplejwt)
- Celery for background tasks

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd amanat-citizen-platform/backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements/development.txt
   ```

4. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your actual configuration values.

5. Run migrations:
   ```bash
   python manage.py migrate
   ```

6. Create the system deputy user for fallback appeal assignments:
   ```bash
   python manage.py create_not_identified_deputy
   ```

7. (Optional) Seed the database with test data:
   ```bash
   python manage.py seed_data
   ```

   Note: This will automatically create the not_identified_deputy user as well.

8. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

9. Start the development server:
   ```bash
   python manage.py runserver
   ```

## Running Celery Worker

To run the Celery worker for background tasks:

```bash
celery -A amanat worker -l info
```

## Running Redis Server

Make sure you have Redis installed and running:

```bash
redis-server
```

## API Endpoints

The API is organized by app:

- Accounts: `/api/accounts/`
- Citizens: `/api/citizens/`
- Deputies: `/api/deputies/`
- Appeals: `/api/appeals/`
- Messages: `/api/messages/`
- Analytics: `/api/analytics/`

## Project Structure

```
backend/
├── amanat/                      # Main project folder
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   ├── asgi.py
│   ├── wsgi.py
│   └── celery.py
├── apps/
│   ├── accounts/
│   ├── citizens/
│   ├── deputies/
│   ├── appeals/
│   ├── messages/
│   ├── analytics/
│   └── notifications/
├── core/
│   ├── utils/
│   └── middleware/
├── requirements/
└── manage.py
```

## Environment Variables

See `.env.example` for all required environment variables.

## Running Tests

```bash
pytest
```

Or run with Django's test runner:

```bash
python manage.py test
```