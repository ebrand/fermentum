#!/bin/bash
# Replace YOUR_ACCESS_TOKEN with the token from localStorage after logging in
ACCESS_TOKEN="${1:-YOUR_ACCESS_TOKEN}"

curl -X POST https://api.fermentum.dev/api/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "512 Brewing Co.",
    "slug": "512-brewing",
    "domain": "512-brewing.fermentum.dev",
    "subdomain": "512-brewing", 
    "planType": "trial",
    "timezone": "America/Chicago",
    "locale": "en-US"
  }'
