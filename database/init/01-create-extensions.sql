-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create application user (separate from postgres superuser)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'fermentum_app') THEN
        CREATE ROLE fermentum_app WITH LOGIN PASSWORD 'app_password_123';
    END IF;
END
$$;

-- Grant necessary permissions
GRANT CONNECT ON DATABASE fermentum TO fermentum_app;
GRANT CREATE ON DATABASE fermentum TO fermentum_app;