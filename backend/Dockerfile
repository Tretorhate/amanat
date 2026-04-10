FROM python:3.11-alpine

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apk add --no-cache \
    postgresql-client \
    build-base \
    libpq-dev \
    curl

# Copy requirements first to leverage Docker cache
COPY ./requirements/base.txt /app/requirements/base.txt
COPY ./requirements/production.txt /app/requirements/production.txt

RUN pip install --upgrade pip && \
    pip install -r requirements/production.txt

COPY . /app/

# Remove .env so secrets don't bake into the image
RUN rm -f /app/.env

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Create non-root user
RUN addgroup -S app && adduser -S -G app app
RUN mkdir -p /app/staticfiles /app/media && chown -R app:app /app/staticfiles /app/media

USER app

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "amanat.asgi:application"]
