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
  function go () {
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
  requestAnimationFrame(function () { setTimeout(go, 0) })
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
