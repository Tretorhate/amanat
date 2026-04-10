FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY ./requirements/base.txt /app/requirements/base.txt
COPY ./requirements/production.txt /app/requirements/production.txt

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements/production.txt

# Copy project
COPY . /app/

# Remove .env so secrets don't bake into the image
RUN rm -f /app/.env

# Expose port
EXPOSE 8000

# Migrate, collect static, then start gunicorn
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && python manage.py create_not_identified_deputy && python manage.py create_test_users && gunicorn --bind 0.0.0.0:8000 --workers 3 amanat.wsgi:application"]