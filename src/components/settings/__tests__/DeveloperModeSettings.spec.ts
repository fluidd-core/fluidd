import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  getDevModeStatusDevModeGet: vi.fn(),
  getDevModeWaiverDevModeWaiverGet: vi.fn(),
  openDevModeConsentDevModeConsentPost: vi.fn(),
  getDevModeConsentDevModeConsentChallengeIdGet: vi.fn(),
  setDevModeDevModePost: vi.fn(),
  refreshDevModeConfigDevModeRefreshPost: vi.fn(),
  manualBackupDevModeBackupPost: vi.fn()
}))

vi.mock('@/aux_api/useAuxApi', () => ({
  useAuxApi: () => ({ devMode: api })
}))

// The mock must be registered before the component and the state capture useAuxApi().
// eslint-disable-next-line import/first
import DeveloperModeSettings from '../DeveloperModeSettings.vue'
// eslint-disable-next-line import/first
import { devModeState, refreshDevMode } from '@/services/dev-mode/state'

function component () {
  const vm = new (DeveloperModeSettings as any)()
  vm.$t = (key: string) => key
  return vm
}

const status = (over: Record<string, unknown> = {}) => ({
  data: { enabled: false, core_cfg: '/opt/klipper/core/M1/core.cfg', guard_armed: true, otp_record_armed: false, otp_fuse: null, ...over }
})

describe('developer mode in Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.setDevModeDevModePost.mockResolvedValue({ data: { enabled: true } })
    api.getDevModeStatusDevModeGet.mockResolvedValue(status())
    api.getDevModeWaiverDevModeWaiverGet.mockResolvedValue({ data: { version: 'w-1', text: 'The printer\'s waiver' } })
  })

  it('reads whether the printer would record it for good', async () => {
    await refreshDevMode()
    expect(devModeState).toMatchObject({ enabled: false, canManage: true, guardArmed: true, otpArmed: false })
    expect(component().fuseText).toMatch(/fuse is disarmed, so you can turn developer mode on and off freely/)

    api.getDevModeStatusDevModeGet.mockResolvedValue(status({ otp_record_armed: true }))
    await refreshDevMode()
    expect(component().fuseTone).toBe('warn')
  })

  it('does not take a page that answers with HTML for an answer', async () => {
    api.getDevModeStatusDevModeGet.mockResolvedValue({ data: '<!doctype html>' })
    await refreshDevMode()
    expect(devModeState.canManage).toBe(false)
  })

  it('asks for the printer\'s own waiver, then a press at the printer, before turning on', async () => {
    await refreshDevMode()
    const vm = component()
    await vm.toggle()
    expect(vm.enableDialog).toBe(true)
    expect(vm.waiverText).toBe('The printer\'s waiver')
    expect(api.setDevModeDevModePost).not.toHaveBeenCalled()

    api.openDevModeConsentDevModeConsentPost.mockResolvedValue({ data: { challenge_id: 'c1', instruction: 'Press the knob', expires_in_seconds: 60 } })
    vm.accepted = true
    await vm.confirmEnable()
    expect(vm.awaiting).toBe(true)

    api.getDevModeConsentDevModeConsentChallengeIdGet.mockResolvedValue({ data: { confirmed: true } })
    await vm.pollConsent()
    expect(api.setDevModeDevModePost).toHaveBeenCalledWith({ enabled: true, waiver_acknowledged: true, waiver_version: 'w-1', challenge_id: 'c1' })
    expect(vm.enableDialog).toBe(false)
    vm.stopWaiting()
  })

  it('turns on directly where the printer has no guard', async () => {
    api.getDevModeStatusDevModeGet.mockResolvedValue(status({ guard_armed: false }))
    await refreshDevMode()
    const vm = component()
    await vm.toggle()
    expect(api.setDevModeDevModePost).toHaveBeenCalledWith({ enabled: true })
    expect(vm.enableDialog).toBe(false)
  })

  it('turns off with one confirmation, no press at the printer', async () => {
    api.getDevModeStatusDevModeGet.mockResolvedValue(status({ enabled: true }))
    await refreshDevMode()
    const vm = component()
    await vm.toggle()
    expect(vm.disableDialog).toBe(true)
    await vm.confirmDisable()
    expect(api.setDevModeDevModePost).toHaveBeenCalledWith({ enabled: false })
    expect(api.openDevModeConsentDevModeConsentPost).not.toHaveBeenCalled()
  })
})
