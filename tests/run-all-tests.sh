#!/usr/bin/env bash
# Run all dx tests

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "========================================"
echo "         dx Test Suite Runner"
echo "========================================"
echo ""

# Change to project root
cd "$PROJECT_ROOT"

# Run deps unit tests
echo "Running deps unit tests..."
echo ""
bash "$SCRIPT_DIR/test-deps.sh"
echo ""

# Build binary for docker tests
echo "Building dx binary for Docker tests..."
bun build --compile src/index.tsx --outfile tests/dx-binary
echo ""

# Run SDK integration tests in Docker
echo "Running SDK integration tests in Docker..."
cd tests
docker build -t dx-test .
docker run --rm dx-test
cd ..

echo ""
echo "========================================"
echo "     All Tests Completed Successfully"
echo "========================================"
