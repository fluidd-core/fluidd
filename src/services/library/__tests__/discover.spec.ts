import { describe, expect, it, vi } from 'vitest'
import { discoverShelves, loadDiscover, safePicture, type DiscoverFeed } from '../discover'

// Shaped as the model service's src/public_v2.rs `discover` answers.
const cube = { id: 'p2', slug: 'calibration-cube', title: 'Calibration cube', category: 'education', creator: { handle: null, display_name: null }, created_at: '2026-10-28T00:00:00Z' }
const feed: DiscoverFeed = {
  m1_ready: [{ slug: 'calibration-cube', title: 'Calibration cube', author: 'Muon3D', thumbnail_url: 'https://models.muon3d.com/v1/public/files/a', print_time_s: 1500, filament_g: 7.6, material: 'PLA' }],
  new: [
    { id: 'p1', slug: 'cable-clip', title: 'Cable clip', category: 'home', creator: { handle: 'muon3d', display_name: 'Muon3D' }, created_at: '2026-10-28T00:00:00Z', thumbnail_url: null },
    cube,
    cube
  ],
  trending: [cube]
}

describe('Discover in Control', () => {
  it('builds the Library\'s shelves in its order, drops empty ones and never shows a print twice on one', () => {
    const shelves = discoverShelves(feed)
    expect(shelves.map(s => s.id)).toEqual(['m1', 'trending', 'new'])
    expect(shelves[0].cards[0]).toMatchObject({
      title: 'Calibration cube',
      facts: '25 min · 8 g · PLA',
      tested: true,
      // A catalogue entry is no publication: it opens the Library's search, as the Library's Discover does.
      href: 'https://library.muon3d.com/search?q=Calibration%20cube&sources=muon3d'
    })
    expect(shelves[1].cards.map(c => c.href)).toEqual(['https://library.muon3d.com/p/calibration-cube'])
    expect(shelves[2].cards.map(c => c.title)).toEqual(['Cable clip', 'Calibration cube'])
    expect(shelves[2].cards[0]).toMatchObject({ byline: '@muon3d', picture: null, tested: false })
    expect(shelves[2].cards[1]).toMatchObject({ byline: 'Muon3D maker' })
  })

  it('leaves out an item it can\'t draw', () => {
    const shelves = discoverShelves({
      m1_ready: [{ title: 'No slug' } as never],
      trending: [{ ...cube, creator: null } as never, null as never],
      new: [cube]
    })
    expect(shelves.map(s => s.id)).toEqual(['new'])
  })

  it('keeps only https pictures', () => {
    expect(safePicture('javascript:alert(1)')).toBeNull()
    expect(safePicture('data:image/png;base64,AAAA')).toBeNull()
    expect(safePicture('http://example.com/a.png')).toBeNull()
    expect(safePicture('https://cdn.example/a.png')).toBe('https://cdn.example/a.png')
  })

  it('reads the public feed without credentials, and says plainly when it can\'t', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...feed, featured: [], news: [] })))
      .mockResolvedValueOnce(new Response('', { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [] })))
      .mockResolvedValueOnce(new Response('<html>captive portal</html>'))
      .mockResolvedValueOnce(new Response('', { status: 502 }))
    await expect(loadDiscover(fetcher)).resolves.toMatchObject({ m1_ready: feed.m1_ready })
    expect(fetcher).toHaveBeenCalledWith('https://models.muon3d.com/v1/public/discover', expect.objectContaining({ method: 'GET', credentials: 'omit' }))
    expect(fetcher.mock.calls[0][1].headers).toBeUndefined()
    await expect(loadDiscover(fetcher)).rejects.toThrow('Discover isn\'t open yet.')
    await expect(loadDiscover(fetcher)).rejects.toThrow('can\'t read')
    await expect(loadDiscover(fetcher)).rejects.toThrow('can\'t read')
    await expect(loadDiscover(fetcher)).rejects.toThrow('Discover didn\'t answer. Try again.')
  })
})
