# Build arguments for cache busting
ARG CACHE_BUSTER=0

# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Cache busting layer (when needed)
RUN echo "cache_buster=${CACHE_BUSTER}"

# Copy package files first for better layer caching
COPY ui/admin/package*.json ./

# Install dependencies (this layer is cached unless package.json changes)
RUN npm ci --only=production --silent

# Copy source code (this layer busts when code changes)
COPY ui/admin/ .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY ui/admin/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]