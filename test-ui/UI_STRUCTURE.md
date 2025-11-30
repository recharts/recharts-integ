# Test Runner UI Structure

## Test Item Layout (Collapsed)

```text
┌────────────────────────────────────────────────────────────────────┐
│ [✓] npm-react18                        ✓ Stable   ✅ passed        │
│                                              [Run] [▶ Show] [✕]     │
├────────────────────────────────────────────────────────────────────┤
│ ✅ Clean  ✅ Set Version  ✅ Install  ✅ Test  ✅ Build  ✅ Verify  │
└────────────────────────────────────────────────────────────────────┘
```

## Test Item Layout (Expanded)

```
┌────────────────────────────────────────────────────────────────────┐
│ [✓] npm-react18                        ✓ Stable   ✅ passed        │
│                                              [Run] [▼ Hide] [✕]     │
├────────────────────────────────────────────────────────────────────┤
│ ✅ Clean  ✅ Set Version  ✅ Install  ✅ Test  ✅ Build  ✅ Verify  │
├────────────────────────────────────────────────────────────────────┤
│ Phase Details:                                                      │
│                                                                      │
│  ┌─────────────────────────────────────────────────┐               │
│  │ ✅ Clean                            0.5s      ▶ │               │
│  └─────────────────────────────────────────────────┘               │
│                                                                      │
│  ┌─────────────────────────────────────────────────┐               │
│  │ ✅ Set Recharts Version             0.3s      ▶ │               │
│  └─────────────────────────────────────────────────┘               │
│                                                                      │
│  ┌─────────────────────────────────────────────────┐               │
│  │ ✅ Install Dependencies             12.4s     ▶ │               │
│  └─────────────────────────────────────────────────┘               │
│                                                                      │
│  ┌─────────────────────────────────────────────────┐               │
│  │ ✅ Run Tests                        3.2s      ▶ │               │
│  └─────────────────────────────────────────────────┘               │
│                                                                      │
│  ┌─────────────────────────────────────────────────┐               │
│  │ ❌ Build                            2.1s      ▼ │               │
│  ├─────────────────────────────────────────────────┤               │
│  │ [Log Output]                                    │               │
│  │ > ts-react16@0.0.0 build                       │               │
│  │ > tsc --project ./tsconfig.app.json && vite... │               │
│  │                                                 │               │
│  │ src/App.tsx(8,8): error TS2786: 'BarChart'...  │               │
│  │   Its return type 'ReactNode' is not a valid..│               │
│  │ ...                                             │               │
│  └─────────────────────────────────────────────────┘               │
│                                                                      │
│  ┌─────────────────────────────────────────────────┐               │
│  │ ⏸️ Verify Dependencies              -        - │               │
│  └─────────────────────────────────────────────────┘               │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

## Running Test Layout

```
┌────────────────────────────────────────────────────────────────────┐
│ [ ] npm-react16                  ⚠ Experimental   ⏳ running       │
│                                                      [Run] [▼ Hide] │
├────────────────────────────────────────────────────────────────────┤
│ ✅ Clean  ✅ Set Version  ✅ Install  ⏳ Test  ⏸️ Build  ⏸️ Verify  │
├────────────────────────────────────────────────────────────────────┤
│ Phase Details:                                                      │
│                                                                      │
│  ┌─────────────────────────────────────────────────┐               │
│  │ ⏳ Run Tests                        (running) ▼ │               │
│  ├─────────────────────────────────────────────────┤               │
│  │ [Real-time Log Output]                          │               │
│  │ Running test suite...                           │               │
│  │ Test 1: ✓ Passed                                │               │
│  │ Test 2: Running...                              │               │
│  └─────────────────────────────────────────────────┘               │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

## Phase Status Icons

- ⏸️ **Pending**: Phase hasn't started yet
- ⏳ **Running**: Phase is currently executing (animated)
- ✅ **Passed**: Phase completed successfully
- ❌ **Failed**: Phase encountered an error

## Color Coding

- **Pending**: Gray background, neutral border
- **Running**: Orange background, animated pulsing
- **Passed**: Green background, green border
- **Failed**: Red background, red border

## Key Behaviors

1. **Default State**: Tests show collapsed with one-line phase summary
2. **Auto-Expand**: Most recent completed phase is expanded by default when showing details
3. **Running Tests**: Current phase is auto-expanded and shows real-time output
4. **Manual Control**: Users can expand/collapse any individual phase
5. **Persistence**: Results persist in session storage across page reloads
