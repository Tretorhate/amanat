# PowerShell script to set up PostgreSQL for digital-deputat production deployment
Write-Host "Setting up PostgreSQL for digital-deputat..."

# Connect to the shared PostgreSQL container and create the database
$createDbResult = docker exec shared-postgres psql -U postgres -c "CREATE DATABASE digital_deputat_db;" 2>&1

# Check if database creation was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "Database 'digital_deputat_db' created successfully!" -ForegroundColor Green
} else {
    Write-Host "Error creating database 'digital_deputat_db'" -ForegroundColor Red
    Write-Host $createDbResult
    exit 1
}

# Connect the shared PostgreSQL container to the shared network
$connectNetworkResult = docker network connect shared_network shared-postgres 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Connected shared-postgres to shared_network!" -ForegroundColor Green
} else {
    Write-Host "Warning: Could not connect shared-postgres to shared_network (may already be connected)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "PostgreSQL setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update your .env files with the correct database connection details"
Write-Host "2. Make sure your shared-postgres container is running and accessible"
Write-Host "3. Run 'docker-compose -f deploy/docker-compose.prod.yml up -d' to start the services"