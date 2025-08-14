#!/bin/bash

# fix broken api

cd ../infrastructure

echo "deploying backend code to lambdas..."
./deploy-backend.sh

echo ""
echo "testing api now..."
curl https://b51btgujid.execute-api.us-east-1.amazonaws.com/dev/health

echo ""
echo "if you see json above, it worked"