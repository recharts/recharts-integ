# Development Guide

## Project Structure

```text
test-ui/
├── src/
│   ├── App.jsx         # Main React component
│   ├── App.css         # Styles for the app
│   ├── main.jsx        # React entry point
│   └── index.css       # Global styles
├── server.js           # Express + WebSocket backend
├── vite.config.js      # Vite configuration
├── index.html          # HTML template
└── package.json        # Dependencies and scripts
```

## Technology Stack

- **Frontend**: React 19, Vite
- **Backend**: Express, WebSocket (ws)
- **Styling**: Pure CSS (no framework)
- **Build Tool**: Vite

## How It Works

### Backend (server.js)

1. **Express API Server** (port 3001):
   - Lists available tests using the `list.js` script
   - Spawns test processes using `run-test.sh`
   - Tracks active test runs in memory

2. **WebSocket Server**:
   - Broadcasts real-time updates to all connected clients
   - Events: test-started, test-output, test-error, test-completed

### Frontend (React)

1. **App.jsx** - Main component with state management:
   - `tests` - List of all available tests
   - `selectedTests` - User-selected tests (Set)
   - `runningTests` - Currently executing tests (Map)
   - `testResults` - Completed tests (Map)

2. **WebSocket Client**:
   - Connects on mount, auto-reconnects on disconnect
   - Updates UI in real-time as tests run

3. **UI Layout**:
   - Left panel: Scrollable test list with checkboxes
   - Right panel: Live output from running/completed tests

## Adding Features

### Add a new API endpoint

Edit `server.js`:

```javascript
app.get('/api/your-endpoint', (req, res) => {
  // Your logic here
  res.json({ data: 'something' });
});
```

### Add a new WebSocket event

Backend (`server.js`):
```javascript
broadcast({
  type: 'your-event',
  data: { /* your data */ }
});
```

Frontend (`App.jsx`):
```javascript
const handleWebSocketMessage = (message) => {
  const { type, data } = message;
  switch (type) {
    case 'your-event':
      // Handle the event
      break;
  }
};
```

### Style Changes

- Global styles: `src/index.css`
- Component styles: `src/App.css`
- Uses CSS custom properties for consistency

## Common Development Tasks

### Hot Reload Not Working?

The frontend has hot module replacement (HMR) enabled by default. If changes aren't reflecting:

1. Check browser console for errors
2. Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
3. Restart Vite dev server

### Backend Changes Not Reflecting?

You need to manually restart the backend server (Ctrl+C and `npm run server` again). Consider using `nodemon` for auto-reload:

```bash
npm install --save-dev nodemon
# Update package.json script: "server": "nodemon server.js"
```

### WebSocket Connection Issues

- Ensure both servers are running
- Check browser console for connection errors
- Verify WS_URL in App.jsx matches your backend port
- Check firewall settings

## Testing

### Test the API directly

```bash
# Get all tests
curl http://localhost:3001/api/tests

# Run a test
curl -X POST http://localhost:3001/api/tests/run \
  -H "Content-Type: application/json" \
  -d '{"testName": "npm:integrations/ts-react18"}'
```

### Test WebSocket connection

Use a WebSocket client or browser console:

```javascript
const ws = new WebSocket('ws://localhost:3001');
ws.onmessage = (event) => console.log(JSON.parse(event.data));
```

## Troubleshooting

### Port already in use

```bash
# Find and kill process on port 3001
lsof -ti:3001 | xargs kill

# Or use a different port
PORT=3002 npm run server
```

### Vite not found

```bash
rm -rf node_modules package-lock.json
npm install
```

### Tests not running

- Check that `run-test.sh` is executable: `chmod +x run-test.sh`
- Verify you're in the correct directory (repository root)
- Check test name format matches `list.js` output

## Performance Considerations

- Test runs are stored in memory (Map) - consider limits for long-running sessions
- WebSocket broadcasts to all clients - scale carefully
- Large test outputs may cause UI lag - consider truncating or pagination

## Future Improvements

Ideas for enhancement:

- [ ] Test history persistence (database or file)
- [ ] Test queue management (run one at a time)
- [ ] Export test results (JSON, CSV)
- [ ] Test comparison view
- [ ] Dark mode toggle
- [ ] Notification system
- [ ] Test scheduling/cron
- [ ] User authentication
- [ ] Multi-user concurrent access
