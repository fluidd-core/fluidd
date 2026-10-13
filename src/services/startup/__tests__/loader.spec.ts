import { describe, expect, it, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import { loaderCanGo, LOADER_ID, rememberTheme, removeLoader, THEME_KEY } from '../loader'

const docWithLoader = () => {
  const doc = document.implementation.createHTMLDocument()
  const el = doc.createElement('div')
  el.id = LOADER_ID
  doc.body.appendChild(el)
  return { doc, el }
}

describe('removeLoader', () => {
  it('adds the gone class and removes the element after 120 ms', async () => {
    vi.useFakeTimers()
    try {
      const { doc, el } = docWithLoader()
      const gone = removeLoader(doc)
      expect(el.classList.contains('muon-loader--gone')).toBe(true)
      expect(doc.getElementById(LOADER_ID)).toBe(el)
      vi.advanceTimersByTime(120)
      await gone
      expect(doc.getElementById(LOADER_ID)).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('is idempotent while it goes', async () => {
    vi.useFakeTimers()
    try {
      const { doc, el } = docWithLoader()
      const a = removeLoader(doc)
      const b = removeLoader(doc)
      vi.advanceTimersByTime(120)
      await Promise.all([a, b])
      expect(doc.getElementById(LOADER_ID)).toBeNull()
      expect(el.isConnected).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('resolves at once when there is no loader', async () => {
    const doc = document.implementation.createHTMLDocument()
    await expect(removeLoader(doc)).resolves.toBeUndefined()
  })
})

describe('loaderCanGo', () => {
  const ready = { routerReady: true, screen: null, cachedShown: false, msSinceMount: 0 }

  it('waits for the first route', () => {
    expect(loaderCanGo({ ...ready, routerReady: false })).toBe(false)
    expect(loaderCanGo(ready)).toBe(true)
  })

  it('holds the connecting screen only while the cached state shows, for 6 s', () => {
    const connecting = { ...ready, screen: 'connecting', cachedShown: true }
    expect(loaderCanGo(connecting)).toBe(false)
    expect(loaderCanGo({ ...connecting, msSinceMount: 6000 })).toBe(true)
    expect(loaderCanGo({ ...connecting, cachedShown: false })).toBe(true)
    expect(loaderCanGo({ ...connecting, screen: null })).toBe(true)
  })
})

describe('rememberTheme', () => {
  it('writes dark or light under the loader key', () => {
    rememberTheme(true)
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')
    rememberTheme(false)
    expect(localStorage.getItem(THEME_KEY)).toBe('light')
  })
})

describe('index.html', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../../../../index.html'), 'utf8')

  it('has the loader before #app', () => {
    expect(html.indexOf('id="muon-loader"')).toBeGreaterThan(-1)
    expect(html.indexOf('id="muon-loader"')).toBeLessThan(html.indexOf('id="app"'))
  })

  it('preloads the wordmark font', () => {
    expect(html).toContain('rel="preload" href="/fonts/krona-one-latin-400-normal.woff2" as="font"')
  })

  it('runs the theme script before any stylesheet or other script', () => {
    const theme = html.indexOf('muon3d.theme')
    expect(theme).toBeGreaterThan(-1)
    const head = html.slice(0, html.indexOf('</head>'))
    const firstStyle = head.indexOf('<style')
    const firstLinkCss = head.indexOf('stylesheet')
    const otherScripts = [...head.matchAll(/<script/g)].map(m => m.index).filter(i => i !== head.lastIndexOf('<script', theme))
    for (const i of otherScripts) expect(theme).toBeLessThan(i)
    if (firstStyle > -1) expect(theme).toBeLessThan(firstStyle)
    if (firstLinkCss > -1) expect(theme).toBeLessThan(firstLinkCss)
  })
})
