// Where /slice finds the slicer, and whether it is there (Slice in the nav
// only then).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkSlicer, probeSlicer, resetSlicerProbe, slicerPresence, slicerUrl } from '../slicerUrl'

const PAGE = 'http://walnut.local'
const EMBED = new URL('/slicer/embed.html', PAGE)

/** The slicer's embed.html as a printer serves it (the build fills in the frame hosts). */
const EMBED_HTML = '<!doctype html><html lang="en"><head><meta charset="UTF-8" />' +
  '<meta name="muon3d-embed-hosts" content="\'self\'" /><title>Muon3D Slicer</title></head><body><div id="root"></div></body></html>'
/** What a server without the slicer answers for any path: Fluidd's own index.html. */
const FLUIDD_HTML = '<!doctype html><html><head><title>Fluidd</title></head><body><div id="app"></div></body></html>'

const answer = (status: number, body: string, type = 'text/html; charset=utf-8') =>
  vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>(async () => new Response(body, { status, headers: { 'Content-Type': type } }))

describe('slicerUrl', () => {
  it('is /slicer/embed.html on this page by default, http(s) only', () => {
    expect(slicerUrl(undefined, `${PAGE}/slice`)?.href).toBe(EMBED.href)
    expect(slicerUrl('https://slicer.example/embed.html#x', PAGE)?.href).toBe('https://slicer.example/embed.html')
    expect(slicerUrl('javascript:alert(1)', PAGE)).toBeNull()
    expect(slicerUrl('https://user:pw@slicer.example/embed.html', PAGE)).toBeNull()
  })
})

describe('checkSlicer', () => {
  it('finds the slicer when its embed.html answers, asked without the cache', async () => {
    const fetch = answer(200, EMBED_HTML)
    await expect(checkSlicer(EMBED, PAGE, fetch)).resolves.toBe(true)
    expect(fetch).toHaveBeenCalledWith(EMBED.href, expect.objectContaining({ cache: 'no-store', credentials: 'same-origin', redirect: 'error' }))
  })

  it.each([
    ['a 404 (an image without the slicer)', answer(404, 'Not Found', 'text/plain')],
    ['Fluidd\'s own index.html (the SPA fallback)', answer(200, FLUIDD_HTML)],
    ['an answer that is not HTML', answer(200, EMBED_HTML, 'text/plain')],
    ['a 500', answer(500, EMBED_HTML)],
    ['no answer at all', vi.fn(async () => { throw new TypeError('Failed to fetch') })]
  ])('finds no slicer for %s', async (_case, fetch) => {
    await expect(checkSlicer(EMBED, PAGE, fetch as any)).resolves.toBe(false)
  })

  it('takes a slicer on another origin (set at build time) as there, without asking it', async () => {
    const fetch = answer(404, '')
    await expect(checkSlicer(new URL('https://slicer.example/embed.html'), PAGE, fetch)).resolves.toBe(true)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('finds no slicer with no URL', async () => {
    await expect(checkSlicer(null, PAGE, answer(200, EMBED_HTML))).resolves.toBe(false)
  })
})

describe('probeSlicer', () => {
  afterEach(() => resetSlicerProbe())

  it('asks once per page load and records what it found', async () => {
    const fetch = answer(200, EMBED_HTML)
    expect(slicerPresence.state).toBe('unknown')
    const [a, b] = await Promise.all([probeSlicer(EMBED, PAGE, fetch), probeSlicer(EMBED, PAGE, fetch)])
    expect([a, b]).toEqual([true, true])
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(slicerPresence.state).toBe('present')
  })

  it('records a slicer that is not there as absent', async () => {
    await expect(probeSlicer(EMBED, PAGE, answer(200, FLUIDD_HTML))).resolves.toBe(false)
    expect(slicerPresence.state).toBe('absent')
  })
})
