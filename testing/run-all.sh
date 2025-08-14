#!/bin/bash

# run all tests

echo "Running tests..."
echo ""

# test login endpoint
echo "Login test..."
./login.sh > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "  Pass"
else
  echo "  Fail"
  exit 1
fi

# test crud operations
echo "CRUD test..."
./crud.sh > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "  Pass"
else
  echo "  Fail"
  exit 1
fi

echo ""
echo "All tests passed"
