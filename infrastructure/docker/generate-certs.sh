#!/bin/bash

# Generate self-signed certificates for local development
CERT_DIR="./infrastructure/traefik"
mkdir -p "$CERT_DIR"

# Create certificate for *.fermentum.localhost
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$CERT_DIR/localhost.key" \
  -out "$CERT_DIR/localhost.crt" \
  -config <(
cat <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = *.fermentum.localhost

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = *.fermentum.localhost
DNS.2 = fermentum.localhost
DNS.3 = admin.fermentum.localhost
DNS.4 = api.fermentum.localhost
DNS.5 = db.fermentum.localhost
DNS.6 = msg.fermentum.localhost
DNS.7 = signal.fermentum.localhost
DNS.8 = traefik.fermentum.localhost
EOF
)

echo "SSL certificates generated in $CERT_DIR/"
echo "Add these to your hosts file:"
echo "127.0.0.1 fermentum.localhost"
echo "127.0.0.1 admin.fermentum.localhost"
echo "127.0.0.1 api.fermentum.localhost"
echo "127.0.0.1 db.fermentum.localhost"
echo "127.0.0.1 msg.fermentum.localhost"
echo "127.0.0.1 signal.fermentum.localhost"
echo "127.0.0.1 traefik.fermentum.localhost"