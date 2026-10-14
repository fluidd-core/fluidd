import { describe, expect, it, vi } from 'vitest'
import { claimLiveView } from '../live-slot'

describe('the live view', () => {
  it('is taken from its holder when another view starts', () => {
    const first = vi.fn()
    const second = vi.fn()
    const giveBackFirst = claimLiveView(first)
    const giveBackSecond = claimLiveView(second)
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).not.toHaveBeenCalled()
    // The first giving it back late doesn't take it from the second.
    giveBackFirst()
    const third = vi.fn()
    claimLiveView(third)
    expect(second).toHaveBeenCalledTimes(1)
    giveBackSecond()
  })

  it('is free once given back, so the next view takes it without asking anyone', () => {
    const only = vi.fn()
    claimLiveView(only)()
    const next = vi.fn()
    claimLiveView(next)
    expect(only).not.toHaveBeenCalled()
  })
})
