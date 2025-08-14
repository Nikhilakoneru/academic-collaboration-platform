#!/bin/bash
# deploy infrastructure

set -e

echo "Starting deployment..."
echo ""

# check terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "terraform not found, install it first"
    exit 1
fi

# check aws cli exists
if ! command -v aws &> /dev/null; then
    echo "aws cli not found, need that too"
    exit 1
fi

# test aws credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "AWS credentials not working. Run aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "Using AWS account: $ACCOUNT_ID"
echo ""

# make health check lambda
echo "Creating health check lambda..."
cat > health-check.js << 'EOF'
exports.handler = async (event) => {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: process.env.ENVIRONMENT,
            project: process.env.PROJECT_NAME
        })
    };
};
EOF

# package it
zip -q health-check.zip health-check.js
rm health-check.js

echo "Running terraform..."
terraform init

# show what will be deployed
terraform plan -out=tfplan

echo ""
echo "Look good? Type 'yes' to deploy: "
read response

if [[ "$response" != "yes" ]]; then
    echo "ok, cancelling"
    rm -f tfplan
    exit 0
fi

# apply terraform changes
terraform apply tfplan
rm -f tfplan

# save configuration
echo "Saving config to .env..."
cat > ../.env << EOF
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=$ACCOUNT_ID

COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
COGNITO_CLIENT_ID=$(terraform output -raw cognito_client_id)

DYNAMODB_TABLE_NAME=$(terraform output -raw dynamodb_table_name)

DOCUMENTS_BUCKET=$(terraform output -raw documents_bucket_name)
FRONTEND_BUCKET=$(terraform output -raw frontend_bucket_name)
FRONTEND_URL=http://$(terraform output -raw frontend_website_url)

LAMBDA_ROLE_ARN=$(terraform output -raw lambda_role_arn)

# endpoints
API_GATEWAY_URL=$(terraform output -raw api_gateway_url 2>/dev/null || echo "not deployed yet")
WEBSOCKET_URL=$(terraform output -raw websocket_url 2>/dev/null || echo "not deployed yet")
EOF

# test the health lambda
echo ""
echo "Testing if lambda works..."
aws lambda invoke \
    --function-name academic-collab-health-check \
    --payload '{}' \
    /tmp/response.json \
    --output text > /dev/null 2>&1

if [ -f /tmp/response.json ]; then
    echo "Lambda response:"
    cat /tmp/response.json
    echo ""
    rm -f /tmp/response.json
fi

echo ""
echo "Done! Infrastructure is up."
echo ""
echo "Frontend URL will be at:"
terraform output -raw frontend_website_url 2>/dev/null || echo "frontend bucket not ready"
echo ""
echo "To check lambda logs:"
echo "aws logs tail /aws/lambda/academic-collab-health-check --follow"
echo ""