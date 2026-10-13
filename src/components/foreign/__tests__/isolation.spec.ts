import { describe, expect, it, vi } from 'vitest'
import App from '@/App.vue'
import CommandBar from '@/components/layout/CommandBar.vue'
import store from '@/store'
import AppBar from '@/components/layout/AppBar.vue'
import * as parkedM1 from '@/services/m1-3d/parked'

describe('foreign printer command isolation', () => {
  it('does not build an M1 model on a foreign overview', () => {
    const prebuild = vi.spyOn(parkedM1, 'prebuild').mockResolvedValue()
    try {
      (App as any).options.methods.onRouteName.call({ foreignPrinterRoute: true }, 'Dashboard')
      expect(prebuild).not.toHaveBeenCalled()
    } finally { prebuild.mockRestore() }
  })

  it.each([
    { key: 'E', ctrlKey: true, shiftKey: true },
    { key: 'H', shiftKey: true },
    { key: 'P', shiftKey: true },
    { key: 'C', shiftKey: true }
  ])('does not send Moonraker commands for $key', keys => {
    const emergencyStop = vi.fn()
    const homeAll = vi.fn()
    const pausePrint = vi.fn()
    const cancelPrint = vi.fn()
    const context = {
      enableKeyboardShortcuts: true,
      foreignPrinterRoute: true,
      handleGoKey: () => false,
      klippyReady: true,
      printerPrinting: keys.key !== 'H',
      emergencyStop,
      homeAll,
      pausePrint,
      cancelPrint
    }
    ;(App as any).options.methods.handleKeyDown.call(context, new KeyboardEvent('keydown', keys))
    for (const command of [emergencyStop, homeAll, pausePrint, cancelPrint]) expect(command).not.toHaveBeenCalled()
  })

  it('does not expose the previously selected Moonraker printer in the command bar', () => {
    const context = { sectionContext: { foreign: true }, socketConnected: true, authenticated: true }
    const previous = store.state
    store.replaceState({ ...previous, config: { ...previous.config, apiUrl: 'http://192.168.1.3' } })
    try {
      expect((CommandBar as any).options.computed.inPrinter.get.call(context)).toBe(false)
    } finally { store.replaceState(previous) }
  })

  it('does not upload dropped files to the selected Moonraker printer', () => {
    const context = { printerFrame: true, otherPrinterRoute: false, sliceRoute: false, foreignPrinterRoute: true, authenticated: true, socketConnected: true, $route: { meta: { fileDropRoot: 'gcodes' } } }
    expect((App as any).options.computed.fileDropRoot.get.call(context)).toBe(false)
  })

  it('hides the selected Moonraker printer emergency stop on foreign pages', () => {
    const context = { sectionContext: { foreign: true }, printerFrame: true, authenticated: true, socketConnected: true }
    expect((AppBar as any).options.computed.showEstop.get.call(context)).toBe(false)
  })
})
