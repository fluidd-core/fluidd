import { describe, expect, it } from 'vitest'
import type { FeedPage, LibraryItem } from '../api'
import { applyFeedPage, MAX_PAGES, syncFeed, type FeedState } from '../feed'

const item = (id: string, rev: number, over: Partial<LibraryItem> = {}): LibraryItem => ({
  id,
  kind: 'plate',
  format: '3mf',
  name: `Print ${id}`,
  size_bytes: 10,
  has_thumbnail: false,
  state: 'ready',
  rev,
  created_at: '2026-10-12T10:00:00Z',
  updated_at: '2026-10-12T10:00:00Z',
  deleted_at: null,
  versioned: true,
  ...over
})

const tombstone = (id: string, rev: number) => item(id, rev, { state: 'deleted', name: '', deleted_at: '2026-10-12T11:00:00Z' })
const page = (items: LibraryItem[], rev: number, over: Partial<FeedPage> = {}): FeedPage => ({ items, rev, reset: false, more: false, ...over })
const start: FeedState = { items: {}, rev: 0 }

describe('the Library feed', () => {
  it('adds and updates prints, and moves the cursor', () => {
    let state = applyFeedPage(start, page([item('a', 1), item('b', 2)], 2))
    state = applyFeedPage(state, page([item('a', 3, { name: 'Renamed' })], 3))
    expect(Object.keys(state.items).sort()).toEqual(['a', 'b'])
    expect(state.items.a.name).toBe('Renamed')
    expect(state.rev).toBe(3)
  })

  it('removes a print when its tombstone arrives', () => {
    let state = applyFeedPage(start, page([item('a', 1), item('b', 2)], 2))
    state = applyFeedPage(state, page([tombstone('a', 3)], 3))
    expect(Object.keys(state.items)).toEqual(['b'])
  })

  it('a tombstone for a print never seen leaves nothing behind', () => {
    expect(applyFeedPage(start, page([tombstone('z', 5)], 5)).items).toEqual({})
  })

  it('a reset is the whole list: what it leaves out is gone', () => {
    const state = applyFeedPage(start, page([item('a', 1), item('b', 2), item('c', 3)], 3))
    const after = applyFeedPage(state, page([item('b', 9)], 9, { reset: true }))
    expect(Object.keys(after.items)).toEqual(['b'])
    expect(after.rev).toBe(9)
  })

  it('reads every page while the service says there is more, from each page\'s rev', async () => {
    const asked: number[] = []
    const pages: Record<number, FeedPage> = {
      0: page([item('a', 1), item('b', 2)], 2, { more: true }),
      2: page([tombstone('a', 3), item('c', 4)], 4)
    }
    const state = await syncFeed(start, async (since) => { asked.push(since); return pages[since] })
    expect(asked).toEqual([0, 2])
    expect(Object.keys(state.items).sort()).toEqual(['b', 'c'])
    expect(state.rev).toBe(4)
  })

  it('a reset on the first page drops what the browser had, then later pages add to it', async () => {
    const had: FeedState = { items: { old: item('old', 1) }, rev: 1 }
    const pages: Record<number, FeedPage> = {
      1: page([item('x', 7)], 7, { reset: true, more: true }),
      7: page([item('y', 8)], 8)
    }
    const state = await syncFeed(had, async since => pages[since])
    expect(Object.keys(state.items).sort()).toEqual(['x', 'y'])
  })

  it('stops after MAX_PAGES however often the service says more', async () => {
    let calls = 0
    await syncFeed(start, async (since) => { calls++; return page([], since + 1, { more: true }) })
    expect(calls).toBe(MAX_PAGES)
  })
})
