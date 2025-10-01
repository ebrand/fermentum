# Build arguments for cache busting
ARG CACHE_BUSTER=0

# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Cache busting layer (when needed)
RUN echo "cache_buster=${CACHE_BUSTER}"

# Copy source code
COPY ui/user/ .

# Remove any existing node_modules and package-lock to avoid architecture conflicts
RUN rm -rf node_modules package-lock.json

# Install dependencies fresh
RUN npm install

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY ui/user/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]