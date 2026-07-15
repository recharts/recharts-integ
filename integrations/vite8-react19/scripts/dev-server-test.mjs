import { chromium } from 'playwright-core'
import { createServer } from 'vite'

const server = await createServer({
  logLevel: 'silent',
  server: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
})

let browser

try {
  await server.listen()

  const address = server.httpServer?.address()
  if (address == null || typeof address === 'string') {
    throw new Error('Vite did not expose a TCP port')
  }

  browser = await chromium.launch({ channel: 'chrome', headless: true })
  const page = await browser.newPage()
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.message))

  await page.goto(`http://127.0.0.1:${address.port}`, {
    waitUntil: 'networkidle',
  })

  try {
    await page.locator('.recharts-line-curve').waitFor({ state: 'visible', timeout: 10_000 })
  } catch (error) {
    if (pageErrors.length > 0) {
      throw new Error(`Vite dev page failed to initialize:\n${pageErrors.join('\n')}`)
    }
    throw error
  }

  if (pageErrors.length > 0) {
    throw new Error(`Vite dev page emitted errors:\n${pageErrors.join('\n')}`)
  }
} finally {
  await browser?.close()
  await server.close()
}
