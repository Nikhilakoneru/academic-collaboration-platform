#!/bin/bash
# deploy lambda functions

set -e

echo "Packaging lambdas..."

cd /Users/nikhilakoneru/Downloads/academic-collaboration-platform/src/backend

# zip each function
for func in auth documents websocket; do
  echo "  - $func"
  cp $func.js index.js
  echo "exports.handler = require('./$func').handler;" > index.js
  zip -q ../../infrastructure/$func.zip index.js $func.js
  rm index.js
done

# install dependencies
echo "Getting node modules..."
npm install --production > /dev/null 2>&1

# include node_modules in zips
cd node_modules
zip -qr ../../../infrastructure/node_modules.zip .
cd ..

# merge zips
cd ../../infrastructure
for func in auth documents websocket; do
  unzip -q $func.zip
  unzip -q node_modules.zip
  zip -qr $func.zip index.js $func.js node_modules
  rm -rf index.js $func.js node_modules
done

# remove temp file
rm node_modules.zip

echo "Deploying..."
terraform plan -out=tfplan > /dev/null 2>&1
terraform apply tfplan
rm tfplan

# add endpoints to env
echo "" >> ../.env
echo "# updated api urls" >> ../.env
echo "API_GATEWAY_URL=$(terraform output -raw api_gateway_url)" >> ../.env
echo "WEBSOCKET_URL=$(terraform output -raw websocket_url)" >> ../.env

echo ""
echo "Backend deployed"
echo "API: $(terraform output -raw api_gateway_url)"
echo "WebSocket: $(terraform output -raw websocket_url)"

# remove zip files
rm -f *.zip

echo "Done"