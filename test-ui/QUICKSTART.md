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
6. **Watch output** - Real-time logs appear on the right
7. **Check results** - ✅ green = passed, ❌ red = failed

## 🔧 Manual Start (if script doesn't work)

```bash
cd test-ui
npm install        # First time only
npm start          # Starts both servers
```

## 💡 Tips

- **Filter by package manager**: Type "npm" or "yarn"
- **Filter by React version**: Type "react18" or "react19"
- **Specify version**: Use the "Recharts version" input
- **Select many**: Use "Select All" then uncheck unwanted
- **Clear results**: Refresh the page

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

## ✨ Example Workflow

```bash
# 1. Start the UI
./start-ui.sh

# 2. In browser (http://localhost:3000)
#    - Type "react18" in filter
#    - Click "Select All"
#    - Click "Run Selected"
#    - Watch tests run in real-time!
```

---

**Happy Testing!** 🧪
