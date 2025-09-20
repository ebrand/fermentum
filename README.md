# Fermentum - Brewery Management SaaS

Multi-tenant SaaS platform for micro-brewery chain management.

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Make (optional, for convenience commands)

### Setup

1. **Initial setup**
   ```bash
   make setup
   ```

2. **Add domains to hosts file**
   Add these entries to `/etc/hosts`:
   ```
   127.0.0.1 fermentum.localhost admin.fermentum.localhost api.fermentum.localhost
   127.0.0.1 db.fermentum.localhost msg.fermentum.localhost signal.fermentum.localhost
   127.0.0.1 traefik.fermentum.localhost
   ```

3. **Start services**
   ```bash
   make start
   ```

### Available Services

| Service | URL | Purpose |
|---------|-----|---------|
| Traefik Dashboard | http://traefik.fermentum.localhost:8080 | Proxy monitoring |
| NATS Monitoring | http://msg.fermentum.localhost | Message queue status |
| PostgreSQL | localhost:5432 | Database (direct connection) |
| Redis | localhost:6379 | Cache/sessions (direct connection) |

### Development Commands

```bash
make help        # Show all available commands
make start       # Start all services
make stop        # Stop all services
make logs        # View all service logs
make logs-db     # View database logs only
make status      # Show service status
make clean       # Remove all data and containers
```

## Architecture

- **Reverse Proxy**: Traefik
- **Database**: PostgreSQL 15 (multi-tenant schemas)
- **Messaging**: NATS with JetStream
- **Cache/Sessions**: Redis
- **SSL**: Self-signed certificates for local development

## Next Steps

1. Core system schema (tenant management)
2. Authentication service (.NET Core + Stytch)
3. Admin UI (React + TailwindCSS)
4. API services