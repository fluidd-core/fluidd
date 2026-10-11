// Checks what a phone downloads to show /setup, the first-run setup page
// (specs/m1-first-run-setup/05-phone-setup-page.md §2 in Muon-3D/OrcaSlicer):
// the entry, with the shared vendor code it carries, plus the setup chunk and
// everything that chunk imports statically. Run after `vite build`.
//
//   node tools/check-setup-budget.cjs [dist]
//
// Fails when the total is over the budget, or when the page pulls in code it
// must never wait for: Monaco, the 3D printer model, charts, the G-code viewer
// or the camera player.
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const BUDGET_KB = 900
const FORBIDDEN = [/monaco/i, /PrinterModel3d/i, /three/i, /echarts/i, /GcodePreview/i, /Hlsstream/i, /muon_link_web/i]

const dist = path.resolve(process.argv[2] || 'dist')
const assets = path.join(dist, 'assets')
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')

// Vite writes absolute asset paths (base '/'); older builds wrote ./assets/.
const entry = [...html.matchAll(/(?:src|href)="(?:\.)?\/(assets\/[^"]+\.(?:js|css))"/g)].map(m => m[1])
const setupChunk = fs.readdirSync(assets).find(f => /^Setup-[\w-]+\.js$/.test(f))
if (!setupChunk) {
  console.error('No Setup-*.js chunk in dist/assets: is /setup still a lazy route?')
  process.exit(1)
}

// Static imports only; a dynamic import() loads later, on demand.
const staticImports = (file) => {
  const code = fs.readFileSync(path.join(dist, file), 'utf8')
  return [...code.matchAll(/(?:\bimport|\bexport)\s*(?:[\w$*{}\s,]*?\bfrom\s*)?["']\.\/([^"']+\.js)["']/g)]
    .map(m => `assets/${m[1]}`)
}

const files = new Set(entry)
const queue = [`assets/${setupChunk}`]
const setupCss = setupChunk.replace(/\.js$/, '.css')
if (fs.existsSync(path.join(assets, setupCss))) files.add(`assets/${setupCss}`)
while (queue.length) {
  const file = queue.shift()
  if (files.has(file)) continue
  files.add(file)
  queue.push(...staticImports(file))
}

let total = 0
const rows = [...files].map(file => {
  const gz = zlib.gzipSync(fs.readFileSync(path.join(dist, file)), { level: 9 }).length
  total += gz
  return { file, kb: Math.round(gz / 1024) }
})
rows.sort((a, b) => b.kb - a.kb).forEach(r => console.log(`${String(r.kb).padStart(6)} KB  ${r.file}`))
console.log(`${String(Math.round(total / 1024)).padStart(6)} KB  total gzipped for /setup (budget ${BUDGET_KB} KB)`)

const forbidden = [...files].filter(f => FORBIDDEN.some(re => re.test(f)))
if (forbidden.length) {
  console.error(`/setup must not load: ${forbidden.join(', ')}`)
  process.exit(1)
}
if (total > BUDGET_KB * 1024) {
  console.error(`/setup is over its ${BUDGET_KB} KB budget`)
  process.exit(1)
}
