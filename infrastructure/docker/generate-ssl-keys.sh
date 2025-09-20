#!/bin/bash

# Enhanced SSL certificate generation for Fermentum local development
# Generates both wildcard certificates and individual service certificates

set -e

CERT_DIR="./infrastructure/traefik"
CA_DIR="./infrastructure/ssl"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Fermentum SSL Certificate Generator ===${NC}"

# Create directories
mkdir -p "$CERT_DIR"
mkdir -p "$CA_DIR"

# Check if OpenSSL is available
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}Error: OpenSSL is not installed or not in PATH${NC}"
    exit 1
fi

echo -e "${YELLOW}Creating local Certificate Authority (CA)...${NC}"

# Generate CA private key
openssl genrsa -out "$CA_DIR/fermentum-ca.key" 4096

# Generate CA certificate
openssl req -new -x509 -days 3650 -key "$CA_DIR/fermentum-ca.key" \
  -out "$CA_DIR/fermentum-ca.crt" \
  -config <(
cat <<EOF
[req]
distinguished_name = req_distinguished_name
prompt = no

[req_distinguished_name]
C = US
ST = Development
L = Local
O = Fermentum Development
OU = Engineering
CN = Fermentum Local CA
emailAddress = dev@fermentum.localhost
EOF
)

echo -e "${GREEN}✓ CA certificate created${NC}"

echo -e "${YELLOW}Generating wildcard certificate for *.fermentum.dev...${NC}"

# Generate private key for wildcard certificate
openssl genrsa -out "$CERT_DIR/localhost.key" 2048

# Generate certificate signing request
openssl req -new -key "$CERT_DIR/localhost.key" \
  -out "$CERT_DIR/localhost.csr" \
  -config <(
cat <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = Development
L = Local
O = Fermentum Development
OU = Engineering
CN = *.fermentum.dev
emailAddress = dev@fermentum.dev

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = *.fermentum.dev
DNS.2 = fermentum.dev
DNS.3 = admin.fermentum.dev
DNS.4 = api.fermentum.dev
DNS.5 = db.fermentum.dev
DNS.6 = msg.fermentum.dev
DNS.7 = signal.fermentum.dev
DNS.8 = traefik.fermentum.dev
DNS.9 = craftbeer.fermentum.dev
DNS.10 = microbrewery.fermentum.dev
IP.1 = 127.0.0.1
IP.2 = ::1
EOF
)

# Sign the certificate with our CA
openssl x509 -req -in "$CERT_DIR/localhost.csr" \
  -CA "$CA_DIR/fermentum-ca.crt" \
  -CAkey "$CA_DIR/fermentum-ca.key" \
  -CAcreateserial \
  -out "$CERT_DIR/localhost.crt" \
  -days 365 \
  -extensions v3_req \
  -extfile <(
cat <<EOF
[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = *.fermentum.dev
DNS.2 = fermentum.dev
DNS.3 = admin.fermentum.dev
DNS.4 = api.fermentum.dev
DNS.5 = db.fermentum.dev
DNS.6 = msg.fermentum.dev
DNS.7 = signal.fermentum.dev
DNS.8 = traefik.fermentum.dev
DNS.9 = craftbeer.fermentum.dev
DNS.10 = microbrewery.fermentum.dev
IP.1 = 127.0.0.1
IP.2 = ::1
EOF
)

# Clean up CSR
rm "$CERT_DIR/localhost.csr"

echo -e "${GREEN}✓ Wildcard certificate created${NC}"

# Create certificate bundle for applications that need it
cat "$CERT_DIR/localhost.crt" "$CA_DIR/fermentum-ca.crt" > "$CERT_DIR/localhost-bundle.crt"

echo -e "${YELLOW}Generating client certificates for development...${NC}"

# Generate client certificate for development/testing
openssl genrsa -out "$CA_DIR/client-dev.key" 2048

openssl req -new -key "$CA_DIR/client-dev.key" \
  -out "$CA_DIR/client-dev.csr" \
  -config <(
cat <<EOF
[req]
distinguished_name = req_distinguished_name
prompt = no

[req_distinguished_name]
C = US
ST = Development
L = Local
O = Fermentum Development
OU = Engineering
CN = fermentum-dev-client
emailAddress = dev@fermentum.dev
EOF
)

openssl x509 -req -in "$CA_DIR/client-dev.csr" \
  -CA "$CA_DIR/fermentum-ca.crt" \
  -CAkey "$CA_DIR/fermentum-ca.key" \
  -CAcreateserial \
  -out "$CA_DIR/client-dev.crt" \
  -days 365 \
  -extensions v3_req \
  -extfile <(
cat <<EOF
[v3_req]
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = clientAuth
EOF
)

rm "$CA_DIR/client-dev.csr"

echo -e "${GREEN}✓ Client certificate created${NC}"

# Set proper permissions
chmod 600 "$CERT_DIR"/*.key "$CA_DIR"/*.key
chmod 644 "$CERT_DIR"/*.crt "$CA_DIR"/*.crt

echo ""
echo -e "${BLUE}=== Certificate Summary ===${NC}"
echo -e "${GREEN}CA Certificate:${NC} $CA_DIR/fermentum-ca.crt"
echo -e "${GREEN}Server Certificate:${NC} $CERT_DIR/localhost.crt"
echo -e "${GREEN}Server Private Key:${NC} $CERT_DIR/localhost.key"
echo -e "${GREEN}Certificate Bundle:${NC} $CERT_DIR/localhost-bundle.crt"
echo -e "${GREEN}Client Certificate:${NC} $CA_DIR/client-dev.crt"
echo -e "${GREEN}Client Private Key:${NC} $CA_DIR/client-dev.key"

echo ""
echo -e "${YELLOW}=== Next Steps ===${NC}"
echo "1. Add the CA certificate to your system's trusted certificates:"
echo -e "   ${BLUE}macOS:${NC} sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $CA_DIR/fermentum-ca.crt"
echo -e "   ${BLUE}Linux:${NC} sudo cp $CA_DIR/fermentum-ca.crt /usr/local/share/ca-certificates/fermentum-ca.crt && sudo update-ca-certificates"
echo -e "   ${BLUE}Windows:${NC} Import $CA_DIR/fermentum-ca.crt into 'Trusted Root Certification Authorities'"

echo ""
echo "2. Add these entries to your /etc/hosts file:"
echo "127.0.0.1 fermentum.dev"
echo "127.0.0.1 admin.fermentum.dev"
echo "127.0.0.1 api.fermentum.dev"
echo "127.0.0.1 db.fermentum.dev"
echo "127.0.0.1 msg.fermentum.dev"
echo "127.0.0.1 signal.fermentum.dev"
echo "127.0.0.1 traefik.fermentum.dev"
echo "127.0.0.1 craftbeer.fermentum.dev"
echo "127.0.0.1 microbrewery.fermentum.dev"

echo ""
echo "3. Import the client certificate into your browser/testing tools for mTLS testing"

echo ""
echo -e "${GREEN}=== Verification ===${NC}"
echo "You can verify the certificate with:"
echo "openssl x509 -in $CERT_DIR/localhost.crt -text -noout"
echo ""
echo "Test the certificate chain:"
echo "openssl verify -CAfile $CA_DIR/fermentum-ca.crt $CERT_DIR/localhost.crt"

# Verify the certificate
if openssl verify -CAfile "$CA_DIR/fermentum-ca.crt" "$CERT_DIR/localhost.crt" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Certificate verification successful${NC}"
else
    echo -e "${RED}✗ Certificate verification failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}SSL certificate generation completed successfully!${NC}"