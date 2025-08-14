#!/bin/bash

# test crud operations

API=https://b51btgujid.execute-api.us-east-1.amazonaws.com/dev

# login first
echo "Logging in..."
RESPONSE=$(curl -s -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}')

TOKEN=$(echo $RESPONSE | sed 's/.*"token":"\([^"]*\)".*/\1/')

if [ -z "$TOKEN" ]; then
  echo "Login failed"
  exit 1
fi

echo "Got token"

# create a new document
echo "Creating document..."
CREATE=$(curl -s -X POST $API/documents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Doc","content":"test content"}')

# backend returns either docId or id
DOC_ID=$(echo $CREATE | sed 's/.*"docId":"\([^"]*\)".*/\1/')
if [ -z "$DOC_ID" ]; then
  DOC_ID=$(echo $CREATE | sed 's/.*"id":"\([^"]*\)".*/\1/')
fi

if [ -z "$DOC_ID" ]; then
  echo "Create failed"
  exit 1
fi

echo "Created doc: $DOC_ID"

# fetch the document
echo "Getting document..."
GET=$(curl -s $API/documents/$DOC_ID \
  -H "Authorization: Bearer $TOKEN")

if ! echo "$GET" | grep -q "$DOC_ID"; then
  echo "Get failed"
  exit 1
fi

# update the document
echo "Updating document..."
curl -s -X PUT $API/documents/$DOC_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated","content":"new content"}' > /dev/null

# get all documents
echo "Listing documents..."
LIST=$(curl -s $API/documents \
  -H "Authorization: Bearer $TOKEN")

if ! echo "$LIST" | grep -q "$DOC_ID"; then
  echo "List failed"
  exit 1
fi

# remove the document
echo "Deleting document..."
curl -s -X DELETE $API/documents/$DOC_ID \
  -H "Authorization: Bearer $TOKEN" > /dev/null

# check if deleted
echo "Verifying deletion..."
CHECK=$(curl -s $API/documents/$DOC_ID \
  -H "Authorization: Bearer $TOKEN")

if ! echo "$CHECK" | grep -q "not found\|404\|error"; then
  echo "Delete failed"
  exit 1
fi

echo "CRUD test passed"
exit 0
