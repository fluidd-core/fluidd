import { describe, expect, it, vi } from 'vitest'
import Vue from 'vue'
import { HOTSPOT_ADDRESS, isHotspotOrigin, useHotspotCheck } from '../useHotspotCheck'

describe('isHotspotOrigin', () => {
  it('is true only for a page served from the hotspot address', () => {
    expect(HOTSPOT_ADDRESS).toBe('10.42.0.1')
    expect(isHotspotOrigin('10.42.0.1')).toBe(true)
  })

  it.each([
    'muon-walnut-8987.local',
    '192.168.1.37',
    '10.42.0.10',
    'app.muon3d.com',
    'control.muon3d.com',
    'localhost'
  ])('is false for a page served from %s', (hostname) => {
    expect(isHotspotOrigin(hostname)).toBe(false)
  })
})

describe('useHotspotCheck', () => {
  it('answers at once, outside any component, without asking the network', () => {
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {})
    const vueWarn = vi.fn()
    Vue.config.warnHandler = vueWarn

    // jsdom serves the test page from localhost.
    const { onHotspot } = useHotspotCheck()

    expect(onHotspot.value).toBe(false)
    expect(vueWarn).not.toHaveBeenCalled()
    Vue.config.warnHandler = undefined as unknown as typeof Vue.config.warnHandler
    warn.mockRestore()
  })
})
