#!/bin/bash

# get token first
TOKEN="put_token_here"

# create a document
curl -X POST https://b51btgujid.execute-api.us-east-1.amazonaws.com/dev/documents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Doc","content":"test content"}'