import fs from 'fs'
import path from 'path'
import type { Plugin } from 'vite'

/**
 * The entry must not run before the loader has painted. A module script in
 * the head can execute before the first frame, so the build turns the entry
 * script into a modulepreload and the stylesheets into preloads, and a small
 * inline bootstrap loads them after a frame: first the CSS, then the entry.
 * Progress marks line up with loader.ts's setLoaderProgress.
 */
const bootstrap = (entry: string, styles: string[]) => `<script>
(function () {
  var ENTRY = ${JSON.stringify(entry)}
  var CSS = ${JSON.stringify(styles)}
  function progress (p) {
    var l = document.getElementById('muon-loader')
    if (l) l.style.setProperty('--muon-loader-progress', p)
  }
  function fail () {
    var e = document.querySelector('#muon-loader .muon-loader__error')
    if (e) e.hidden = false
  }
  function boot () {
    import(ENTRY).catch(fail)
  }
  var went = false
  function go () {
    if (went) return
    went = true
    progress(0.15)
    if (!CSS.length) { progress(0.5); boot(); return }
    var done = 0
    CSS.forEach(function (href) {
      var l = document.createElement('link')
      l.rel = 'stylesheet'
      l.crossOrigin = 'anonymous'
      var next = function () {
        if (++done === CSS.length) { progress(0.5); boot() }
      }
      l.onload = next
      l.onerror = next
      l.href = href
      document.head.appendChild(l)
    })
  }
  /* rAF is no proof a frame was presented; the first real paint is. */
  var observing = false
  try {
    new PerformanceObserver(function (list) {
      var entries = list.getEntries()
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].name === 'first-paint' || entries[i].name === 'first-contentful-paint') { go(); return }
      }
    }).observe({ type: 'paint', buffered: true })
    observing = true
  } catch (e) {}
  if (!observing) requestAnimationFrame(function () { setTimeout(go, 0) })
  setTimeout(go, 300)
})()
</script>`

const vitePluginStartup = (): Plugin => {
  return {
    name: 'muon-startup',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler (html) {
        const entries: string[] = []
        const styles: string[] = []

        html = html.replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/g, (_m, src) => {
          entries.push(src)
          return `<link rel="modulepreload" crossorigin href="${src}">`
        })
        html = html.replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/g, (_m, href) => {
          styles.push(href)
          return `<link rel="preload" as="style" crossorigin href="${href}">`
        })

        return html.replace('</body>', `${bootstrap(entries[0] ?? '', styles)}\n</body>`)
      }
    }
  }
}

export default vitePluginStartup

/**
 * Keeps the service worker's precache to the app shell (KAN-525): index.html,
 * the entry scripts and styles it names and the chunks they statically
 * import (the same walk tools/check-setup-budget.cjs does), and the fonts.
 * Lazy chunks — Monaco and its workers, the viewer, charts, wasm — are left
 * to the runtime cache in sw.ts, so a fresh install downloads only the shell.
 */
export const shellOnly = (distDir: string) => (entries: Array<{ url: string }>) => {
  const keep = new Set(['index.html'])
  const queue = [...fs.readFileSync(path.join(distDir, 'index.html'), 'utf8')
    .matchAll(/(?:src|href)="(?:\.)?\/(assets\/[^"]+\.(?:js|css))"/g)]
    .map(m => m[1])
  while (queue.length) {
    const file = queue.shift() as string
    if (keep.has(file)) continue
    keep.add(file)
    if (!file.endsWith('.js')) continue
    const code = fs.readFileSync(path.join(distDir, file), 'utf8')
    for (const m of code.matchAll(/(?:\bimport|\bexport)\s*(?:[\w$*{}\s,]*?\bfrom\s*)?["']\.\/([^"']+\.js)["']/g)) {
      queue.push(`assets/${m[1]}`)
    }
  }

  const manifest = entries.filter(e => (
    keep.has(e.url) || /^fonts\/.+\.woff2$/.test(e.url) || /^assets\/.+\.woff2$/.test(e.url)
  ))
  return { manifest, warnings: [] as string[] }
}
