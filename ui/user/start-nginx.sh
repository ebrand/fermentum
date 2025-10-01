#!/bin/sh

# Get the PORT environment variable from Railway or default to 80
PORT=${PORT:-80}

# Replace the port in nginx config
sed -i "s/listen 80;/listen $PORT;/g" /etc/nginx/conf.d/default.conf

# Start nginx
nginx -g 'daemon off;'
