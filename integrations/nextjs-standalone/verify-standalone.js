const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

// In some environments this might install nested. Check your next.config.js for output settings.
let serverPath = path.join(__dirname, '.next/standalone/server.js');

if (!fs.existsSync(serverPath)) {
    console.error('Could not find server.js in .next/standalone');
    process.exit(1);
}

console.log(`Starting standalone server from ${serverPath}...`);
const PORT = 3456; // Use an arbitrary port to reduce conflicts

const server = spawn('node', [serverPath], {
  env: { ...process.env, PORT: PORT.toString() },
  stdio: 'inherit'
});

let checked = false;

server.on('exit', (code) => {
  if (!checked) {
      console.error(`Server exited unexpectedly with code ${code}`);
      process.exit(code || 1);
  }
});

const cleanup = () => {
  checked = true;
  server.kill();
};

const checkServer = (retries = 20) => {
  if (retries === 0) {
    console.error('Server failed to start in time');
    cleanup();
    process.exit(1);
  }

  const req = http.get(`http://localhost:${PORT}`, (res) => {
    console.log(`Server responded with status: ${res.statusCode}`);
    if (res.statusCode === 200) {
      console.log('Verification successful!');
      cleanup();
      process.exit(0);
    } else {
      console.error('Server responded with non-200 status');
      cleanup();
      process.exit(1);
    }
  });

  req.on('error', (e) => {
    // Connection refused or similar
    setTimeout(() => checkServer(retries - 1), 500);
  });
};

// Start checking
setTimeout(() => checkServer(), 1000);
