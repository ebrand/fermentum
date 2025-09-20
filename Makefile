.PHONY: help setup start stop restart logs clean certs

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

status: ## Show status of all services
	@docker-compose ps