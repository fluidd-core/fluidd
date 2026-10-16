import { describe, expect, it, vi } from 'vitest'
import { retireProStorage } from '@/services/retired-storage'
import appSource from '@/App.vue?raw'
import appBarSource from '@/components/layout/AppBar.vue?raw'
import appTabBarSource from '@/components/layout/AppTabBar.vue?raw'
import commandBarSource from '@/components/layout/CommandBar.vue?raw'

const firstPartyModules = import.meta.glob('../../**/*.{ts,vue}', {
  eager: true,
  import: 'default',
  query: '?raw'
}) as Record<string, string>

describe('retired Pro mode', () => {
  it('has no first-party module importing pro-mode', () => {
    const readers = Object.entries(firstPartyModules)
      .filter(([path, source]) => !path.includes('/slicer-bridge/vendor/') && /from ['"](?:@\/services|\.{1,2}\/[^'"]*)\/pro-mode['"]/.test(source))
      .map(([path]) => path)
    expect(readers).toEqual([])
  })

  it.each(['0', '1'])('retires the old storage value %s without reading it', value => {
    localStorage.setItem('muon3d.pro', value)
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    retireProStorage()
    expect(getItem).not.toHaveBeenCalledWith('muon3d.pro')
    getItem.mockRestore()
    expect(localStorage.getItem('muon3d.pro')).toBeNull()
  })

  it('leaves Shift X unbound', () => {
    expect(appSource).not.toContain("case 'Shift+X'")
  })

  it.each([
    ['AppBar', appBarSource],
    ['AppTabBar', appTabBarSource],
    ['CommandBar', commandBarSource]
  ])('%s contains no Pro switch', (_name, source) => {
    expect(source).not.toMatch(/pro-switch|more-pro|Turn Pro|Pro controls/)
  })
})
