import { describe, it, expect } from 'vitest'
import App from './App'
import { render } from '@testing-library/react'
import React from "react";

describe('App', () => {
    it('should render svg and two bars', () => {
        const { container } = render(<App />)
        const svg = container.getElementsByTagName('svg')[0]
        expect(svg).toBeDefined()
        const bars = container.getElementsByClassName('recharts-bar-rectangle')
        expect(bars).toHaveLength(2)
    })

    it('should render svg and two bars in strict mode', () => {
        // reproduces https://github.com/recharts/recharts/issues/6022
        const { container } = render(<App />, { wrapper: React.StrictMode })
        const svg = container.getElementsByTagName('svg')[0]
        expect(svg).toBeDefined()
        const bars = container.getElementsByClassName('recharts-bar-rectangle')
        expect(bars).toHaveLength(2)
    })
})
