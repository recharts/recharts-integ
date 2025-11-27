# Quick Start Guide

## 🚀 30-Second Setup

```bash
# From repository root
./start-ui.sh
```

Then open: **http://localhost:3000**

That's it! 🎉

## 📋 What You Can Do

1. **View all tests** - Automatically loaded from `list.js`
2. **See stability** - ✓ Stable (CI-tested) or ⚠ Experimental badges
3. **Filter tests** - Type in the filter box
4. **Run single test** - Click any "Run" button
5. **Run multiple tests** - Check boxes → "Run Selected"
6. **Serial execution** - Tests run one at a time (queued)
7. **Watch output** - Real-time logs appear on the right
8. **Check results** - ✅ green = passed, ❌ red = failed
9. **Reload page** - Results are preserved (sessionStorage)
10. **Cancel tests** - Use "⏹ Cancel & Clear Queue" button
11. **Clear results** - Use ✕ button or "🗑 Clear All Results"

## 🔧 Manual Start (if script doesn't work)

```bash
cd test-ui
npm install        # First time only
npm start          # Starts both servers
```

## 💡 Tips

- **Filter by stability**: Type "stable" or "experimental"
- **Filter by package manager**: Type "npm" or "yarn"
- **Filter by React version**: Type "react18" or "react19"
- **Specify version**: Use the "Recharts version" input
- **Select many**: Use "Select All" then uncheck unwanted
- **Multiple tests**: They run one at a time (serial, not parallel)
- **Queue position**: See "Queued (#N)" badge for position in queue
- **Results persist**: Reload page and see previous results
- **Cancel anytime**: Use "⏹ Cancel & Clear Queue" button
- **Clear one result**: Click ✕ on individual test result
- **Clear all results**: Use "🗑 Clear All Results" button

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port already in use | Kill process: `lsof -ti:3001 \| xargs kill` |
| Tests don't load | Check `list.js` works: `node list.js` |
| Build fails | Reinstall: `rm -rf node_modules && npm install` |
| WebSocket errors | Ensure both servers are running |

## 📚 More Info

- **Full documentation**: See [README.md](./README.md)
- **Developer guide**: See [DEVELOPMENT.md](./DEVELOPMENT.md)
- **API reference**: See [SUMMARY.md](./SUMMARY.md)
- **Visual guide**: See [SCREENSHOTS.md](./SCREENSHOTS.md)

## ⌨️ Keyboard Shortcuts

- `Ctrl+C` - Stop servers
- `Cmd+R` / `F5` - Refresh page
- `Tab` - Navigate between elements
- `Space` - Toggle checkbox when focused

## 🌐 URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **WebSocket**: ws://localhost:3001

## 📞 Support

If something doesn't work:

1. Check you're in the correct directory
2. Ensure `run-test.sh` is executable: `chmod +x run-test.sh`
3. Verify Node.js is installed: `node --version`
4. Check the browser console for errors (F12)
5. Look at terminal output for backend errors

## ✨ Example Workflows

**Run all stable tests:**
```bash
# 1. Start the UI
./start-ui.sh

# 2. In browser (http://localhost:3000)
#    - Type "stable" in filter
#    - Click "Select All"
#    - Click "Run Selected"
#    - Watch tests run in real-time!
```

**Run experimental tests for React 18:**
```bash
# 1. Start the UI
./start-ui.sh

# 2. In browser (http://localhost:3000)
#    - Type "experimental" in filter
#    - Manually select React 18 tests
#    - Click "Run Selected"
```

---

**Happy Testing!** 🧪
