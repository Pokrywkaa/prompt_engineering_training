#!/bin/bash

# NPM-based test runner for Public Transport API
# Run this from the frontend directory or test directory

echo "🧪 Public Transport API Test Runner"
echo "📦 Using npm to run Jasmine tests..."
echo ""

# Check if we're in the test directory and need to go up one level
if [[ $(basename "$PWD") == "test" ]]; then
    echo "📂 Detected test directory, moving to parent directory..."
    cd ..
fi

# Check if package.json exists
if [[ ! -f "package.json" ]]; then
    echo "❌ package.json not found!"
    echo "💡 Make sure you're in the frontend directory"
    exit 1
fi

# Check if node_modules exists, if not, install dependencies
if [[ ! -d "node_modules" ]]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Parse command line arguments
MODE=${1:-"open"}

case $MODE in
    "serve"|"server")
        echo "🚀 Starting HTTP server with tests..."
        echo "🌐 Tests will open at: http://localhost:3001/test/SpecRunner.html"
        npm run test:serve
        ;;
    "open"|"browser"|*)
        echo "🌐 Opening tests in browser..."
        npm test
        ;;
esac

echo ""
echo "✅ Test runner executed"
echo ""
echo "📋 Available commands:"
echo "  ./run-tests.sh        - Open tests in browser (default)"
echo "  ./run-tests.sh serve  - Start HTTP server with tests"
echo "  npm test              - Open tests in browser"
echo "  npm run test:serve    - Start HTTP server with tests"
