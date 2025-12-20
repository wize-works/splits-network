#!/bin/bash
# Start only RabbitMQ for local development
# This allows running services via pnpm dev while having RabbitMQ available

echo "Starting RabbitMQ for local development..."
docker-compose up -d rabbitmq

echo ""
echo "✅ RabbitMQ started!"
echo ""
echo "📊 Management UI: http://localhost:15672"
echo "   Username: splits"
echo "   Password: splits_local_dev"
echo ""
echo "🔌 AMQP Connection: amqp://splits:splits_local_dev@localhost:5672"
echo ""
echo "To stop: docker-compose down"
