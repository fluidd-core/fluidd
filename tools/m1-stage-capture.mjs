// Usage: PLAYWRIGHT_CORE=/path/to/playwright-core node tools/m1-stage-capture.mjs [url] [outDir]
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const playwrightCorePath = process.env.PLAYWRIGHT_CORE ?? '/home/ubuntu/tools-pw/node_modules/playwright-core'
const { chromium } = require(playwrightCorePath)

const url = process.argv[2] ?? 'http://localhost:5173/src/dev/m1-stage/index.html'
const outDir = process.argv[3] ?? '/home/ubuntu/m1-frames'
const cadenceMs = 120
const durations = {
  'plate-off-print': 1800,
  'plate-on-print': 2200,
  'plate-off-empty': 1800,
  'plate-on-empty': 1400,
  'tube-unlock': 0,
  'tube-detach': 1100,
  'tube-attach': 900,
  'filament-load': 2600,
  'autoload-grabbed': 900,
  'autoload-done': 0,
  'filament-unload': 2200
}

const browser = await chromium.connectOverCDP('http://localhost:29229')
const context = await browser.newContext({ viewport: { width: 960, height: 640 }, deviceScaleFactor: 1 })
try {
  const page = await context.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.bringToFront()
  await page.evaluate(() => window.m1Stage.ready)

  for (const step of await page.evaluate(() => window.m1Stage.steps)) {
    const directory = path.join(outDir, step)
    await mkdir(directory, { recursive: true })
    await page.evaluate(name => window.m1Stage.step(name), step)
    const stopAt = Date.now() + durations[step] + 300
    const framePaths = []
    let frame = 0
    let inFlight = 0
    let screenshotError
    const pending = []
    const capture = () => {
      if (Date.now() > stopAt || inFlight >= 2) return
      const framePath = path.join(directory, `${String(frame).padStart(3, '0')}.png`)
      inFlight++
      pending.push(page.screenshot({ path: framePath }).catch(error => {
        screenshotError ??= error
      }).finally(() => {
        inFlight--
      }))
      framePaths.push(framePath)
      frame++
    }
    capture()
    const timer = setInterval(capture, cadenceMs)
    await page.waitForTimeout(durations[step] + 300)
    clearInterval(timer)
    await Promise.all(pending)
    if (screenshotError) throw screenshotError
    await page.screenshot({ path: path.join(directory, 'final.png') })

    const selected = framePaths.length <= 8
      ? framePaths
      : Array.from({ length: 8 }, (_, i) => framePaths[Math.round(i * (framePaths.length - 1) / 7)])
    const dataUrls = await Promise.all(selected.map(async framePath => {
      const image = await readFile(framePath)
      return `data:image/png;base64,${image.toString('base64')}`
    }))
    const sheet = await page.evaluate(async images => {
      const columns = 4
      const cellWidth = 240
      const cellHeight = 160
      const gap = 12
      const rows = Math.ceil(images.length / columns)
      const canvas = document.createElement('canvas')
      canvas.width = columns * cellWidth + (columns + 1) * gap
      canvas.height = rows * cellHeight + (rows + 1) * gap
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Could not create contact sheet canvas')
      context.fillStyle = '#d8dbdf'
      context.fillRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < images.length; i++) {
        const image = new Image()
        image.src = images[i]
        await image.decode()
        const x = gap + (i % columns) * (cellWidth + gap)
        const y = gap + Math.floor(i / columns) * (cellHeight + gap)
        context.drawImage(image, x, y, cellWidth, cellHeight)
      }
      return canvas.toDataURL('image/png')
    }, dataUrls)
    await writeFile(path.join(directory, 'contact-sheet.png'), Buffer.from(sheet.split(',')[1], 'base64'))
    console.log(`${step}: ${framePaths.length} frames → ${directory}`)
  }
} finally {
  await context.close()
  await browser.close()
}
