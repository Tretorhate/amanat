#!/bin/bash

# Script to set up PostgreSQL for digital-deputat production deployment
echo "Setting up PostgreSQL for digital-deputat..."

# Connect to the shared PostgreSQL container and create the database
docker exec -it shared-postgres psql -U postgres -c "CREATE DATABASE digital_deputat_db;"

# Check if database creation was successful
if [ $? -eq 0 ]; then
    echo "Database 'digital_deputat_db' created successfully!"
else
    echo "Error creating database 'digital_deputat_db'"
    exit 1
fi

# Connect the shared PostgreSQL container to the shared network
docker network connect shared_network shared-postgres

if [ $? -eq 0 ]; then
    echo "Connected shared-postgres to shared_network!"
else
    echo "Warning: Could not connect shared-postgres to shared_network (may already be connected)"
fi

echo "PostgreSQL setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your .env files with the correct database connection details"
echo "2. Make sure your shared-postgres container is running and accessible"
echo "3. Run 'docker-compose -f deploy/docker-compose.prod.yml up -d' to start the services"