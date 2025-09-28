#!/bin/bash

# Script để setup Prisma cho tất cả services
# Chạy script này sau khi đã khởi động databases

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Kiểm tra Docker containers
print_status "Kiểm tra Docker containers..."
if ! docker-compose -f docker-compose.databases.yml ps | grep -q "Up"; then
    print_error "Database containers chưa chạy. Hãy chạy: docker-compose -f docker-compose.databases.yml up -d"
    exit 1
fi

print_success "Database containers đang chạy"

# Chờ databases sẵn sàng
print_status "Chờ databases sẵn sàng..."
sleep 10

# Function để setup Prisma cho một service
setup_prisma_service() {
    local service_name=$1
    local port=$2
    
    print_status "Setting up Prisma cho $service_name..."
    
    cd "apps/$service_name"
    
    # Kiểm tra nếu Prisma đã được cài đặt
    if [ ! -f "package.json" ] || ! grep -q "prisma" package.json; then
        print_warning "Cài đặt Prisma cho $service_name..."
        pnpm add prisma @prisma/client
    fi
    
    # Kiểm tra database connection
    local db_name="rental_${service_name//-service/}"
    local db_user="${service_name//-service/}_user"
    
    print_status "Kiểm tra kết nối database cho $service_name..."
    
    # Wait for database to be ready
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec "rental-postgres-${service_name//-service/}" pg_isready -U $db_user -d $db_name > /dev/null 2>&1; then
            print_success "Database $db_name sẵn sàng"
            break
        else
            print_status "Chờ database $db_name sẵn sàng... ($attempt/$max_attempts)"
            sleep 2
            ((attempt++))
        fi
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "Database $db_name không sẵn sàng sau $max_attempts attempts"
        cd ../..
        continue
    fi
    
    # Generate Prisma client
    print_status "Generating Prisma client cho $service_name..."
    npx prisma generate
    
    # Push schema to database
    print_status "Pushing schema to database cho $service_name..."
    npx prisma db push
    
    print_success "✅ $service_name setup hoàn thành"
    
    cd ../..
}

# Setup từng service
print_status "Bắt đầu setup Prisma cho tất cả services..."

setup_prisma_service "auth-service" "5432"
setup_prisma_service "vehicle-service" "5433"
setup_prisma_service "booking-service" "5434"
setup_prisma_service "payment-service" "5435"
setup_prisma_service "review-service" "5436"

print_success "🎉 Tất cả Prisma setups hoàn thành!"

# Kiểm tra tất cả services
print_status "Kiểm tra tất cả services..."

for service in auth-service vehicle-service booking-service payment-service review-service; do
    if [ -d "apps/$service/node_modules/.prisma" ]; then
        print_success "✅ $service: Prisma client generated"
    else
        print_error "❌ $service: Prisma client chưa được generate"
    fi
done

print_status "Setup hoàn thành! Bạn có thể:"
echo "1. Mở Prisma Studio: cd apps/auth-service && npx prisma studio"
echo "2. Kiểm tra PgAdmin: http://localhost:5050 (admin@rental.com / pgadmin_password_123)"
echo "3. Kiểm tra MinIO: http://localhost:9001 (admin / minio_password_123)"
echo "4. Chạy applications: pnpm dev:backend"
