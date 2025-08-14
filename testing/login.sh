#!/bin/bash

# test login endpoint
curl -X POST https://b51btgujid.execute-api.us-east-1.amazonaws.com/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'