# Recharts Integration Test UI

A React-based web interface for managing and running Recharts integration tests.

## Features

- 📋 List all available integration tests
- 🏷️ Stability indicators (Stable/Experimental badges)
- ▶️ Run tests individually or in bulk
- 🔄 Serial execution (tests run one at a time)
- 📊 Real-time test output and status updates via WebSockets
- 🔍 Filter tests by name, stability, or keywords
- ✅ View test results with pass/fail status
- 📝 Inspect detailed logs for each test run
- 📊 Structured phase output (6 phases with duration and status)
- 🔽 Collapsible phase sections (auto-expand current phase)
- 💾 Persistent results (survives page reload)
- ⏹ Cancel running tests and clear queue
- 🗑 Clear individual or all test results

## Getting Started

### Installation

```bash
cd test-ui
npm install
```

### Running the Application

Start both the backend API server and frontend dev server:

```bash
npm start
```

This will start:
- Backend API server on `http://localhost:3001`
- Frontend React app on `http://localhost:3000`

Alternatively, you can run them separately:

```bash
# Terminal 1 - Backend server
npm run server

# Terminal 2 - Frontend dev server
npm run dev
```

### Usage

1. Open `http://localhost:3000` in your browser
2. The test list will load automatically
3. Select one or more tests using checkboxes
4. Optionally specify a Recharts version
5. Click "Run Selected" to execute tests
6. Watch real-time output in the right panel

## Architecture

### Backend (server.js)

- Express API server on port 3001
- WebSocket server for real-time updates
- Endpoints:
  - `GET /api/tests` - List all available tests
  - `POST /api/tests/run` - Start a test run
  - `GET /api/tests/:testId` - Get test status
  - `GET /api/tests/active/all` - Get all active tests

### Frontend (React + Vite)

- Modern React app with hooks
- Real-time WebSocket connection for live updates
- Two-panel layout:
  - Left: Test list with selection and filtering
  - Right: Live test output and results

## Development

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## API Usage

You can also interact with the API directly:

```bash
# List all tests
curl http://localhost:3001/api/tests

# Run a test
curl -X POST http://localhost:3001/api/tests/run \
  -H "Content-Type: application/json" \
  -d '{"testName": "npm:integrations/ts-react18"}'

# Run with specific version
curl -X POST http://localhost:3001/api/tests/run \
  -H "Content-Type: application/json" \
  -d '{"testName": "npm:integrations/ts-react18", "rechartsVersion": "2.5.0"}'
```
