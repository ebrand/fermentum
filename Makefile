.PHONY: help setup start stop restart logs clean certs clean-build build-fresh build-api build-ui verify-build

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: ## Initial setup - generate certificates and create data directories
	@echo "Setting up Fermentum development environment..."
	@mkdir -p infrastructure/data/postgres infrastructure/data/redis infrastructure/data/nats infrastructure/data/letsencrypt infrastructure/ssl
	@./infrastructure/docker/generate-ssl-keys.sh
	@echo "\n🚀 Fermentum development environment setup complete!"
	@echo "\n📝 Next steps:"
	@echo "1. Run 'make ssl-install' to install CA certificate (requires sudo)"
	@echo "2. Run 'make start' to launch all services"

start: ## Start all services
	@docker-compose up -d
	@echo "Services starting..."
	@echo "Traefik Dashboard: http://traefik.fermentum.localhost:8080"
	@echo "NATS Monitoring: http://msg.fermentum.localhost"

stop: ## Stop all services
	@docker-compose down

restart: ## Restart all services
	@docker-compose restart

logs: ## Show logs for all services
	@docker-compose logs -f

logs-db: ## Show database logs
	@docker-compose logs -f postgres

logs-traefik: ## Show Traefik logs
	@docker-compose logs -f traefik

clean: ## Remove all containers, volumes, and data
	@docker-compose down -v
	@docker system prune -f
	@rm -rf infrastructure/data/

certs: ## Regenerate SSL certificates (basic)
	@./infrastructure/docker/generate-certs.sh

ssl: ## Generate enhanced SSL certificates with CA
	@./infrastructure/docker/generate-ssl-keys.sh

ssl-install: ssl ## Generate and install SSL certificates to system trust store (macOS)
	@echo "Installing CA certificate to system trust store..."
	@sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain infrastructure/ssl/fermentum-ca.crt
	@echo "CA certificate installed successfully"

ssl-production: ## Set up Let's Encrypt SSL for production (www.fermentum.dev)
	@echo "🔒 Setting up Let's Encrypt SSL for production..."
	@./infrastructure/scripts/init-ssl-dirs.sh
	@docker-compose -f docker-compose.yml -f infrastructure/docker/docker-compose.ssl.yml up -d
	@echo "⏳ Waiting for services to start..."
	@sleep 10
	@echo "📝 To obtain certificates, run:"
	@echo "   make ssl-obtain"

ssl-obtain: ## Obtain Let's Encrypt certificates (run after ssl-production)
	@echo "🔑 Obtaining Let's Encrypt certificates..."
	@docker exec fermentum-certbot certbot certonly \
		--webroot \
		--webroot-path=/var/www/certbot \
		--email eric.d.brand@gmail.com \
		--agree-tos \
		--no-eff-email \
		--domains www.fermentum.dev,fermentum.dev,admin.fermentum.dev,api.fermentum.dev \
		--non-interactive \
		--keep-until-expiring
	@echo "📋 Copying certificates to nginx..."
	@docker exec fermentum-certbot sh -c "cp /etc/letsencrypt/live/www.fermentum.dev/fullchain.pem /etc/nginx/ssl/www.fermentum.dev/ && cp /etc/letsencrypt/live/www.fermentum.dev/privkey.pem /etc/nginx/ssl/www.fermentum.dev/"
	@echo "🔄 Reloading nginx..."
	@docker exec fermentum-nginx nginx -s reload
	@echo "✅ SSL certificates obtained and applied!"

ssl-renew: ## Manually renew Let's Encrypt certificates
	@echo "🔄 Renewing certificates..."
	@docker exec fermentum-certbot certbot renew --quiet
	@docker exec fermentum-nginx nginx -s reload
	@echo "✅ Certificates renewed and nginx reloaded"

ssl-status: ## Check SSL certificate status
	@echo "📋 Certificate status:"
	@docker exec fermentum-certbot certbot certificates

status: ## Show status of all services
	@docker-compose ps

# Development targets
dev-rebuild-api: ## Rebuild and restart fermentum-api service (for development)
	@echo "🔨 Rebuilding fermentum-api service..."
	@docker-compose build fermentum-api
	@docker-compose up -d fermentum-api
	@echo "✅ fermentum-api service rebuilt and restarted"

dev-rebuild-ui: ## Rebuild and restart UI services (for development)
	@echo "🔨 Rebuilding UI services..."
	@docker-compose build ui-user ui-admin
	@docker-compose up -d ui-user ui-admin
	@echo "✅ UI services rebuilt and restarted"

dev-rebuild-all: ## Rebuild and restart all services (for development)
	@echo "🔨 Rebuilding all services..."
	@docker-compose build
	@docker-compose up -d
	@echo "✅ All services rebuilt and restarted"

dev-watch-api: ## Watch fermentum-api files and auto-rebuild on changes (requires 'brew install fswatch')
	@echo "👀 Watching fermentum-api files for changes..."
	@echo "Press Ctrl+C to stop watching"
	@echo "Note: Install fswatch with 'brew install fswatch' if not installed"
	@fswatch -o services/fermentum-api/ --exclude="\.git|\.vscode|bin/|obj/|\.dll|\.pdb" | while read f; do \
		echo "🔄 Changes detected, rebuilding fermentum-api..."; \
		make dev-rebuild-api; \
		echo "⏰ Waiting for next change..."; \
	done

# Battle-tested Docker Build Commands
# These implement comprehensive cache-busting and build verification

clean-build: ## Nuclear option - completely clean Docker environment
	@echo "🧹 NUCLEAR CLEAN: Removing all containers, images, volumes, and cache..."
	@docker-compose down -v --remove-orphans || true
	@docker system prune -af --volumes || true
	@docker builder prune -af || true
	@echo "✅ Docker environment completely cleaned"

build-fresh: clean-build ## Clean build with Git SHA injection and verification
	@echo "🚀 FRESH BUILD: Building with Git SHA and timestamp..."
	$(eval GIT_SHA := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown"))
	$(eval BUILD_TIME := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ"))
	$(eval CACHE_BUSTER := $(shell date +%s))
	@echo "📝 Git SHA: $(GIT_SHA)"
	@echo "🕐 Build Time: $(BUILD_TIME)"
	@echo "🎲 Cache Buster: $(CACHE_BUSTER)"
	@docker-compose build \
		--build-arg GIT_SHA=$(GIT_SHA) \
		--build-arg BUILD_TIME=$(BUILD_TIME) \
		--build-arg CACHE_BUSTER=$(CACHE_BUSTER) \
		--no-cache
	@echo "🔍 Verifying build..."
	@make verify-build GIT_SHA=$(GIT_SHA)
	@echo "✅ Fresh build complete and verified"

build-api: ## Build only API service with Git SHA
	@echo "🔨 Building fermentum-api with Git SHA..."
	$(eval GIT_SHA := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown"))
	$(eval BUILD_TIME := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ"))
	$(eval CACHE_BUSTER := $(shell date +%s))
	@echo "📝 Git SHA: $(GIT_SHA)"
	@docker-compose build \
		--build-arg GIT_SHA=$(GIT_SHA) \
		--build-arg BUILD_TIME=$(BUILD_TIME) \
		--build-arg CACHE_BUSTER=$(CACHE_BUSTER) \
		--no-cache fermentum-api
	@docker-compose up -d fermentum-api
	@echo "🔍 Verifying API build..."
	@make verify-build GIT_SHA=$(GIT_SHA)
	@echo "✅ API build complete and verified"

build-ui: ## Build only UI services with cache busting
	@echo "🔨 Building UI services..."
	$(eval CACHE_BUSTER := $(shell date +%s))
	@docker-compose build \
		--build-arg CACHE_BUSTER=$(CACHE_BUSTER) \
		--no-cache ui-user ui-admin
	@docker-compose up -d ui-user ui-admin
	@echo "✅ UI services rebuilt"

verify-build: ## Verify that the build contains the expected Git SHA
	@echo "🔍 Verifying build contains Git SHA: $(GIT_SHA)"
	@sleep 5  # Wait for container to fully start
	@echo "📋 Checking container labels..."
	@if docker inspect fermentum-fermentum-api-1 --format '{{.Config.Labels}}' | grep -q "$(GIT_SHA)"; then \
		echo "✅ Container has correct Git SHA label"; \
	else \
		echo "❌ Container missing Git SHA label"; \
		exit 1; \
	fi
	@echo "📋 Checking startup logs for version info..."
	@timeout 30 bash -c 'until docker logs fermentum-fermentum-api-1 2>&1 | grep -q "Git SHA"; do sleep 1; done' || \
		(echo "❌ Version info not found in startup logs"; exit 1)
	@echo "✅ Build verification complete"

# Emergency debugging commands
debug-containers: ## Show detailed container information
	@echo "🔍 Container Debug Information:"
	@echo "================================"
	@docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.CreatedAt}}"
	@echo ""
	@echo "🏷️  Image Labels (fermentum-api):"
	@docker inspect fermentum-fermentum-api-1 --format '{{json .Config.Labels}}' 2>/dev/null | jq . || echo "Container not found"
	@echo ""
	@echo "🌍 Environment Variables (fermentum-api):"
	@docker inspect fermentum-fermentum-api-1 --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null | grep -E "(APP_VERSION|BUILD_TIME|GIT)" || echo "No version env vars found"

debug-build-cache: ## Show Docker build cache information
	@echo "🗂️  Docker Build Cache Information:"
	@docker system df
	@echo ""
	@echo "📦 Builder Cache:"
	@docker builder ls
	@echo ""
	@echo "🧹 To clear all cache: make clean-build"