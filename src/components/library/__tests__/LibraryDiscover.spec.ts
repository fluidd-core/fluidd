import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import LibraryDiscover from '../LibraryDiscover.vue'

const publication = { id: 'p1', slug: 'cable-clip', title: 'Cable clip', category: 'home', creator: { handle: 'muon3d', display_name: 'Muon3D' }, created_at: '2026-10-28T00:00:00Z', thumbnail_url: 'https://models.muon3d.com/v1/public/files/p1.png' }

function answer (body: unknown, status = 200) {
  return vi.fn(async () => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }))
}

async function render (fetcher: () => Promise<Response>) {
  vi.stubGlobal('fetch', fetcher)
  const wrapper = mount(LibraryDiscover, { stubs: ['frame-icon'] })
  expect(wrapper.find('[role="status"]').text()).toBe('Loading Discover')
  await vi.waitFor(() => expect(wrapper.find('[role="status"]').exists()).toBe(false))
  return wrapper
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('LibraryDiscover (KAN-735)', () => {
  it('draws the shelves, each card opening on library.muon3d.com', async () => {
    const wrapper = await render(answer({ featured: [], m1_ready: [], trending: [], new: [publication], news: [] }))
    try {
      expect(wrapper.find('[data-tid="library-discover-new"] h2').text()).toBe('New this week')
      const card = wrapper.find('[data-tid="library-discover-card-pub:p1"]')
      expect(card.attributes('href')).toBe('https://library.muon3d.com/p/cable-clip')
      expect(card.find('img').attributes('src')).toBe(publication.thumbnail_url)
      expect(card.text()).toContain('@muon3d')
    } finally {
      wrapper.destroy()
    }
  })

  it('says so when nothing is published yet', async () => {
    const wrapper = await render(answer({ featured: [], m1_ready: [], trending: [], new: [], news: [] }))
    try {
      expect(wrapper.find('[data-tid="library-discover-empty"]').text()).toContain('Nothing to discover yet')
    } finally {
      wrapper.destroy()
    }
  })

  it('offers Try again and the Library itself when Discover doesn\'t answer', async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(new Response(JSON.stringify({ featured: [], m1_ready: [], trending: [], new: [publication], news: [] })))
    const wrapper = await render(fetcher)
    try {
      expect(wrapper.find('[role="alert"]').text()).toContain('Check your connection, then try again.')
      expect(wrapper.find('[data-tid="library-discover-open"]').attributes('href')).toBe('https://library.muon3d.com/')
      await wrapper.find('[role="alert"] button').trigger('click')
      await vi.waitFor(() => expect(wrapper.find('[data-tid="library-discover-new"]').exists()).toBe(true))
    } finally {
      wrapper.destroy()
    }
  })
})
