#!/usr/bin/env bash

# Script to start the Recharts Integration Test UI

set -e

echo "🚀 Starting Recharts Integration Test UI..."
echo ""

cd test-ui

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "🌐 Starting servers..."
echo "   - Backend API: http://localhost:3001"
echo "   - Frontend UI:  http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

npm start
