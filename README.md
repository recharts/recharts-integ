# recharts-integ
Recharts integration tests for different React versions and various other frameworks.

## 📦 Prerequisites

This repository tests Recharts with multiple package managers. Install the ones you need:

### npm
Comes with Node.js - no separate installation needed.

### Yarn
```bash
npm install -g yarn
# or via Homebrew on macOS
brew install yarn
```

### pnpm
```bash
npm install -g pnpm
# or via Homebrew on macOS
brew install pnpm
# or using standalone installer
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

For more installation options, see:
- [Yarn Installation](https://classic.yarnpkg.com/en/docs/install)
- [pnpm Installation](https://pnpm.io/installation)

## 🎯 Test UI (New!)

A modern React-based web interface for managing and running integration tests. No more command-line juggling!

### Quick Start

```bash
./start-ui.sh
```

Then open <http://localhost:3000> in your browser.

### Features

- 📋 List all available integration tests
- 🏷️ Stability indicators (Stable/Experimental badges)
- ▶️ Run tests individually or in bulk
- 🔄 Serial execution (tests run one at a time to prevent conflicts)
- 📊 Real-time test output and status updates
- 🔍 Filter tests by name, stability, or package manager
- ✅ View test results with pass/fail indicators
- 📝 Inspect detailed logs for each test run
- 📊 Structured phase output with collapsible sections
- 💾 Persistent results (survives page reload)
- ⏹ Cancel running tests and clear queue

See [test-ui/README.md](./test-ui/README.md) for more details.

## 🔧 Command Line Usage

### List all tests

```bash
node list.js
node list.js --json
node list.js --ci  # CI-stable tests only
```

### Run a single test

```bash
./run-test.sh <test-name>
./run-test.sh npm:integrations/ts-react18
./run-test.sh npm:integrations/ts-react18 2.5.0  # with specific version
```

### Pack and run with local recharts

```bash
./pack-and-run.sh <test-name>
```
