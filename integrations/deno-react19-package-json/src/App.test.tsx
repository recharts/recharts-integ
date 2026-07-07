import 'global-jsdom/register';
import { cleanup, render } from '@testing-library/react';
import { assert, assertEquals } from '@std/assert';
import App from './App.tsx';

Deno.test('should render svg and bars', async () => {
    const { container } = render(<App />);
    const svg = container.getElementsByTagName('svg')[0];
    assert(svg, 'expected an <svg> to be rendered');
    const bars = container.getElementsByClassName('recharts-bar-rectangle');
    assertEquals(bars.length, 4);
    cleanup();
    // Recharts dispatches through Redux Toolkit's autoBatchEnhancer, which
    // schedules a requestAnimationFrame plus a 100ms setTimeout fallback per
    // notification. Let those settle, then close the jsdom window so its
    // remaining timers are cleared — otherwise Deno's test sanitizer reports
    // them as leaks.
    await new Promise((resolve) => setTimeout(resolve, 150));
    window.close();
});
