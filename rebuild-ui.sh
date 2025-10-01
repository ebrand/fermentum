#!/bin/bash

# Fermentum UI User Container Rebuild Script
# This script safely rebuilds and redeploys the user UI Docker container

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if we're in the correct directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found. Please run this script from the project root directory."
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_status "Starting UI user container rebuild process..."

# Step 1: Stop the current UI container
print_status "Stopping ui-user container..."
if docker-compose stop ui-user; then
    print_success "UI user container stopped successfully"
else
    print_warning "Container may have already been stopped"
fi

# Step 2: Remove the container
print_status "Removing ui-user container..."
if docker-compose rm -f ui-user; then
    print_success "UI user container removed successfully"
else
    print_warning "Container may have already been removed"
fi

# Step 3: Remove old image (optional, but ensures completely fresh build)
print_status "Removing old ui-user image..."
if docker image rm fermentum-ui-user 2>/dev/null; then
    print_success "Old UI user image removed"
else
    print_warning "Old image may not exist or may be in use"
fi

# Step 4: Build new container with no cache
print_status "Building new ui-user container (this may take a few minutes)..."
if docker-compose build --no-cache ui-user; then
    print_success "UI user container built successfully"
else
    print_error "Failed to build UI user container"
    exit 1
fi

# Step 5: Start the new container
print_status "Starting new ui-user container..."
if docker-compose up -d ui-user; then
    print_success "UI user container started successfully"
else
    print_error "Failed to start UI user container"
    exit 1
fi

# Step 6: Wait a moment and check container health
print_status "Checking container status..."
sleep 3

CONTAINER_STATUS=$(docker-compose ps ui-user --format "table {{.Status}}" | tail -n 1)
if echo "$CONTAINER_STATUS" | grep -q "Up"; then
    print_success "UI user container is running"

    # Show container logs for a few seconds to verify startup
    print_status "Recent container logs:"
    docker-compose logs --tail=10 ui-user

    print_success "UI rebuild complete! 🎉"
    print_status "The updated UI is now available at:"
    print_status "  • Local: http://localhost:3001"
    print_status "  • Domain: https://fermentum.dev (if configured)"

else
    print_error "Container appears to have issues. Status: $CONTAINER_STATUS"
    print_status "Showing recent logs for troubleshooting:"
    docker-compose logs --tail=20 ui-user
    exit 1
fi

print_status "Rebuild process completed successfully! ✅"