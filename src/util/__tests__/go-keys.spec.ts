import { describe, expect, it } from 'vitest'
import { GO_KEY_WINDOW_MS, GoKeys } from '../go-keys'

describe('G keys', () => {
  it('G then a letter goes there', () => {
    const keys = new GoKeys()
    expect(keys.feed('g', 1000)).toEqual({ kind: 'start' })
    expect(keys.feed('j', 1200)).toEqual({ kind: 'go', key: 'j' })
  })

  it('a letter alone is not a sequence', () => {
    const keys = new GoKeys()
    expect(keys.feed('j', 1000)).toBeNull()
  })

  it('the second key must come soon after G', () => {
    const keys = new GoKeys()
    keys.feed('g', 1000)
    expect(keys.feed('j', 1000 + GO_KEY_WINDOW_MS + 1)).toBeNull()
  })

  it('a modified key ends the sequence', () => {
    const keys = new GoKeys()
    keys.feed('g', 1000)
    expect(keys.feed('Ctrl+j', 1100)).toBeNull()
    expect(keys.feed('j', 1200)).toBeNull()
  })

  it('G then G is a sequence like any other, for a letter no page uses', () => {
    const keys = new GoKeys()
    keys.feed('g', 1000)
    expect(keys.feed('g', 1100)).toEqual({ kind: 'go', key: 'g' })
  })
})
