#!/bin/bash

# check if aws is working

echo "checking lambdas..."
aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'academic-collab')].FunctionName" --output text

echo ""
echo "if you see function names above, infra is deployed"
echo "if api still doesnt work, run: cd ../infrastructure && ./deploy-backend.sh"