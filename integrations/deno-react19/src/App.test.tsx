import 'global-jsdom/register';
import { render } from '@testing-library/react';
import { assert, assertEquals } from '@std/assert';
import App from './App.tsx';

Deno.test('should render svg and bars', () => {
    const { container } = render(<App />);
    const svg = container.getElementsByTagName('svg')[0];
    assert(svg, 'expected an <svg> to be rendered');
    const bars = container.getElementsByClassName('recharts-bar-rectangle');
    assertEquals(bars.length, 4);
});
