// Frames of each M1 accessory animation from the dev stage (src/dev/m1-stage), on a clock the script sets,
// so every frame is at its exact time however slowly the browser draws.
// Usage: npm run dev, then
//   PLAYWRIGHT_CORE=/path/to/playwright-core node tools/m1-stage-capture.mjs [url] [outDir]
// Chrome must expose CDP on localhost:29229. Writes <outDir>/<step>/NNN.png and <outDir>/<step>/sheet.png.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_CORE ?? 'playwright-core')

const url = process.argv[2] ?? 'http://localhost:5173/src/dev/m1-stage/index.html'
const outDir = process.argv[3] ?? 'm1-frames'
const only = process.env.STEPS ? process.env.STEPS.split(',') : null
/** How long each step's animation runs (accessory-motion.ts), and how often a frame is taken. */
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
const STEP_MS = Number(process.env.STEP_MS ?? 100)

const browser = await chromium.connectOverCDP('http://localhost:29229')
const context = await browser.newContext({ viewport: { width: 960, height: 640 }, deviceScaleFactor: 1 })
await context.addInitScript(() => {
  const real = performance.now.bind(performance)
  window.__clock = null
  performance.now = () => window.__clock ?? real()
})
try {
  const page = await context.newPage()
  await page.goto(url + (process.env.QUERY ?? ''), { waitUntil: 'networkidle' })
  await page.bringToFront()
  await page.evaluate(() => window.m1Stage.ready)
  let clock = await page.evaluate(() => performance.now() + 1000)
  const drawAt = async at => {
    await page.evaluate(at => new Promise(resolve => {
      window.__clock = at
      window.m1Stage.sync && requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    }), at)
  }
  await drawAt(clock)

  for (const step of await page.evaluate(() => window.m1Stage.steps)) {
    const run = only === null || only.includes(step)
    const directory = path.join(outDir, step)
    if (run) await mkdir(directory, { recursive: true })
    await page.evaluate(name => window.m1Stage.step(name), step)
    const frames = []
    const end = durations[step] + 300
    for (let t = 0; t <= end; t += STEP_MS) {
      await drawAt(clock + t)
      if (!run) continue
      const framePath = path.join(directory, `${String(frames.length).padStart(3, '0')}.png`)
      await page.screenshot({ path: framePath })
      frames.push({ framePath, t })
    }
    clock += end + 400
    await drawAt(clock)
    if (!run) continue

    const picked = frames.length <= 8 ? frames : Array.from({ length: 8 }, (_, i) => frames[Math.round(i * (frames.length - 1) / 7)])
    const images = await Promise.all(picked.map(async f => ({ t: f.t, src: `data:image/png;base64,${(await readFile(f.framePath)).toString('base64')}` })))
    const sheet = await page.evaluate(async ({ images, title }) => {
      const columns = 4
      const w = 480
      const h = 320
      const canvas = document.createElement('canvas')
      canvas.width = columns * w
      canvas.height = Math.ceil(images.length / columns) * h + 36
      const g = canvas.getContext('2d')
      g.fillStyle = '#d8dbdf'
      g.fillRect(0, 0, canvas.width, canvas.height)
      g.fillStyle = '#1a1f22'
      g.font = '600 20px sans-serif'
      g.fillText(title, 12, 25)
      for (let i = 0; i < images.length; i++) {
        const image = new Image()
        image.src = images[i].src
        await image.decode()
        const x = (i % columns) * w
        const y = 36 + Math.floor(i / columns) * h
        g.drawImage(image, x, y, w, h)
        g.font = '14px sans-serif'
        g.fillText(`${images[i].t} ms`, x + 10, y + 20)
      }
      return canvas.toDataURL('image/png')
    }, { images, title: step })
    await writeFile(path.join(directory, 'sheet.png'), Buffer.from(sheet.split(',')[1], 'base64'))
    console.log(`${step}: ${frames.length} frames`)
  }
} finally {
  await context.close()
  await browser.close()
}
