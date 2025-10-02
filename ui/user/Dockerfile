# Build arguments for cache busting and API URL
ARG CACHE_BUSTER=0
ARG VITE_API_URL=http://localhost:5001/api
ARG VITE_STYTCH_PUBLIC_TOKEN

# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Cache busting layer (when needed)
RUN echo "cache_buster=${CACHE_BUSTER}"

# Copy source code
COPY . .

# Remove any existing node_modules and package-lock to avoid architecture conflicts
RUN rm -rf node_modules package-lock.json

# Install dependencies fresh
RUN npm install

# Set environment variables for Vite build
# CRITICAL: These values MUST be set at build time for Vite to embed them
# Railway's variable system isn't passing them correctly, so hardcode for now
ENV VITE_API_URL="https://www.fermentum.dev/api"
ENV VITE_STYTCH_PUBLIC_TOKEN="public-token-test-92b06025-3b67-4193-a934-54b95bb5bbcb"

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy start script
COPY start-nginx.sh /start-nginx.sh
RUN chmod +x /start-nginx.sh

# Expose port 80 (Railway will override with PORT env var)
EXPOSE 80

# Health check - use PORT env var if set
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-80}/ || exit 1

# Start nginx with dynamic port configuration
CMD ["/start-nginx.sh"]