import { describe, it, expect } from 'vitest'
import App from './App'
import { render } from '@testing-library/react'

describe('App', () => {
    it('should render svg and two bars', () => {
        const { container } = render(<App />)
        const svg = container.getElementsByTagName('svg')[0]
        expect(svg).toBeDefined()
        const bars = container.getElementsByClassName('recharts-bar-rectangle')
        expect(bars).toHaveLength(2)
    })
})
