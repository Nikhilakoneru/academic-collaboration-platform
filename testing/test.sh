#!/bin/bash
# quick api test

API=https://b51btgujid.execute-api.us-east-1.amazonaws.com/dev

echo "testing api..."

# try logging in
curl -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

echo ""
echo "if you see a token above, api is working"