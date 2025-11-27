# UI Screenshots & Visual Guide

Since this is a text-based documentation, here's a detailed description of what the UI looks like:

## 🎨 Visual Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🧪 Recharts Integration Test Runner                                    │
│  [Purple gradient header]                                               │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│  [Filter: _______________] [Version: _______________]                   │
│  [Select All (48)] [Deselect All] [Run Selected (0)]                   │
└─────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────┬──────────────────────────────────────────┐
│ Tests (48)                   │ Test Output                              │
├──────────────────────────────┼──────────────────────────────────────────┤
│                              │                                          │
│ ☐ npm:integrations/ts-react16│ No tests running. Select and run        │
│   ⚠ Experimental [Run]      │ tests to see output.                     │
│                              │                                          │
│ ☑ npm:integrations/ts-react18│                                          │
│   ✓ Stable ⏳ Running [Run] │                                          │
│                              │                                          │
│ ☐ npm:integrations/ts-react19│                                          │
│   ✓ Stable ✅ Passed [Run]  │                                          │
│                              │                                          │
│ ☐ yarn:integrations/ts-react │                                          │
│   [Run]                      │                                          │
│                              │                                          │
│ ...                          │                                          │
│                              │                                          │
└──────────────────────────────┴──────────────────────────────────────────┘
```

## Color Scheme

### Header
- **Background**: Purple gradient (#667eea → #764ba2)
- **Text**: White
- **Style**: Clean, modern with shadow

### Test Items

**Default State**:
- Border: Light gray (#e0e0e0)
- Background: White
- Hover: Gray border with subtle shadow

**Selected State**:
- Border: Purple (#667eea)
- Background: Light blue tint (#f8f9ff)

**Running State**:
- Border: Orange (#ffa726)
- Background: Light orange tint (#fff8f0)
- Badge: Orange with "⏳ Running"

**Passed State**:
- Border: Green (#66bb6a)
- Background: Light green tint (#f0fff0)
- Badge: Green with "✅ Passed"

**Failed State**:
- Border: Red (#ef5350)
- Background: Light red tint (#fff0f0)
- Badge: Red with "❌ Failed"

### Stability Badges

**Stable Badge**:
- Background: Light blue (#e3f2fd)
- Text: Dark blue (#1565c0)
- Icon: ✓
- Label: "Stable"

**Experimental Badge**:
- Background: Light orange (#fff3e0)
- Text: Dark orange (#e65100)
- Icon: ⚠
- Label: "Experimental"

## Component Breakdown

### 1. Header Bar
```
┌─────────────────────────────────────────┐
│  🧪 Recharts Integration Test Runner    │
└─────────────────────────────────────────┘
```
- Full width gradient background
- Large centered title with emoji
- Box shadow for depth

### 2. Control Panel
```
┌─────────────────────────────────────────┐
│ Filter: [______________]                │
│ Version: [______________]               │
│                                         │
│ [Select All] [Deselect] [Run Selected] │
└─────────────────────────────────────────┘
```
- Two text inputs in top row
- Three action buttons in bottom row
- Clean spacing, rounded corners

### 3. Test List (Left Panel)
```
┌──────────────────────────────┐
│ Tests (48)                   │
├──────────────────────────────┤
│                              │
│ ┌──────────────────────────┐ │
│ │☑ npm:integrations/ts...  │ │
│ │  ✓ Stable ✅ Passed [Run]│ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │☐ yarn:integrations/ts... │ │
│ │  ⚠ Experimental   [Run]  │ │
│ └──────────────────────────┘ │
│                              │
└──────────────────────────────┘
```
- Scrollable container
- Each test in rounded rectangle card
- Checkbox on left
- Test name in monospace font
- Status badge (if running/completed)
- Run button on right

### 4. Output Panel (Right Panel)
```
┌────────────────────────────────┐
│ Test Output                    │
├────────────────────────────────┤
│                                │
│ npm:integrations/ts-react18    │
│ ⏳ Running                     │
│ ┌────────────────────────────┐ │
│ │$ npm install               │ │
│ │added 234 packages...       │ │
│ │                            │ │
│ │$ npm run build             │ │
│ │> build                     │ │
│ │> tsc && vite build         │ │
│ │                            │ │
│ │✅ Build successful         │ │
│ └────────────────────────────┘ │
│                                │
└────────────────────────────────┘
```
- Scrollable container
- Test name as header with status badge
- Dark terminal-style output box
- Monospace font for logs
- Syntax colors (white text, orange errors)

## Button Styles

**Primary Button** (Run Selected):
- Background: Purple (#667eea)
- Text: White
- Hover: Darker purple with lift effect and shadow

**Secondary Button** (Select All, Deselect):
- Background: Light gray (#f0f0f0)
- Text: Dark gray
- Hover: Slightly darker gray

**Small Button** (Run):
- Smaller padding and font size
- Same color scheme as primary
- Fits inline with test items

## Typography

- **Header**: 1.8rem, semi-bold
- **Section Titles**: 1.2rem
- **Test Names**: 0.9rem, monospace (Courier New)
- **Buttons**: 0.95rem, medium weight
- **Output**: 0.85rem, monospace

## Spacing & Layout

- **Panels**: 50/50 split on desktop, stacked on mobile
- **Padding**: Consistent 1.5rem on panels
- **Gaps**: 0.75rem between test items, 1rem in controls
- **Border Radius**: 6-8px for soft corners
- **Max Output Height**: 400px with scroll

## Responsive Design

**Desktop (>1024px)**:
- Side-by-side panels
- Full button text visible
- Comfortable spacing

**Tablet/Mobile (<1024px)**:
- Stacked layout (test list above output)
- Touch-friendly button sizes
- Reduced padding for space efficiency

## Interactive States

### Hover Effects
- Test items: Border color change + subtle shadow
- Buttons: Background darkens + lift effect (translateY)
- Inputs: Border color changes to purple

### Focus States
- Inputs: Purple border outline
- Buttons: Visible focus ring
- Checkboxes: Browser default focus style

### Disabled States
- Buttons: 50% opacity + no-drop cursor
- Checkboxes: When test is running

## Empty States

**No Tests Available**:
```
┌──────────────────────────────┐
│ Tests (0)                    │
├──────────────────────────────┤
│                              │
│    No tests found            │
│                              │
└──────────────────────────────┘
```

**No Output**:
```
┌──────────────────────────────┐
│ Test Output                  │
├──────────────────────────────┤
│                              │
│  No tests running. Select    │
│  and run tests to see output │
│                              │
└──────────────────────────────┘
```

## Loading State

```
┌─────────────────────────────┐
│                             │
│      Loading tests...       │
│                             │
└─────────────────────────────┘
```
- Centered text
- Gray color
- Full viewport height

## Error Banner

```
┌─────────────────────────────────────────┐
│ ⚠️ Failed to load tests: Network error │ [✕]
└─────────────────────────────────────────┘
```
- Red background (#fee)
- Red text (#c33)
- Dismissible with X button
- Appears below header

## Animations

- **Smooth Transitions**: 0.2s for colors, borders, shadows
- **Button Hover**: Subtle upward movement (1px)
- **Panel Scroll**: Smooth native scrolling
- **Status Changes**: Instant with color transitions

## Accessibility Features

- ✅ Semantic HTML structure
- ✅ Proper heading hierarchy (h1, h2, h3)
- ✅ Button labels and aria-labels
- ✅ Keyboard navigable (tab order)
- ✅ Focus indicators visible
- ✅ Color contrast meets WCAG standards
- ✅ Checkbox inputs properly labeled

## Dark Mode Considerations

Currently light mode only. For dark mode, would change:
- Background: #1e1e1e
- Text: #e0e0e0
- Cards: #2d2d2d
- Borders: #404040
- Output box: Keep dark (already dark-themed)

## Browser Compatibility

Tested and works on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

Requires:
- ES6+ support
- WebSocket support
- Flexbox/Grid layout support
- CSS custom properties (optional)
