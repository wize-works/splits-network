# Start only RabbitMQ for local development
# This allows running services via pnpm dev while having RabbitMQ available

Write-Host "Starting RabbitMQ for local development..." -ForegroundColor Cyan
docker-compose up -d rabbitmq

Write-Host ""
Write-Host "✅ RabbitMQ started!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Management UI: http://localhost:15672" -ForegroundColor Yellow
Write-Host "   Username: splits" -ForegroundColor Gray
Write-Host "   Password: splits_local_dev" -ForegroundColor Gray
Write-Host ""
Write-Host "🔌 AMQP Connection: amqp://splits:splits_local_dev@localhost:5672" -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop: docker-compose down" -ForegroundColor Gray
