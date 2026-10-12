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

// The knob's answer comes through Moonraker's /server/aux/proxy, as on a real printer (KAN-518).
const http = vi.hoisted(() => ({ post: vi.fn() }))
vi.mock('@/api/httpClientActions', () => ({ httpClientActions: http }))

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

    http.post.mockResolvedValue({ data: { result: { challenge_id: 'c1', confirmed: false, expires_at: 1 } } })
    await vm.pollConsent()
    expect(http.post).toHaveBeenCalledWith('/server/aux/proxy', { path: '/dev_mode/consent/c1', method: 'GET' })
    expect(api.getDevModeConsentDevModeConsentChallengeIdGet).not.toHaveBeenCalled()
    expect(api.setDevModeDevModePost).not.toHaveBeenCalled()

    http.post.mockResolvedValue({ data: { result: { challenge_id: 'c1', confirmed: true, expires_at: 1 } } })
    await vm.pollConsent()
    expect(api.setDevModeDevModePost).toHaveBeenCalledWith({ enabled: true, waiver_acknowledged: true, waiver_version: 'w-1', challenge_id: 'c1' })
    expect(vm.enableDialog).toBe(false)
    vm.stopWaiting()
  })

  it('stops waiting when the knob is held to turn it down, and says so when the printer stops answering', async () => {
    await refreshDevMode()
    const vm = component()
    await vm.toggle()
    api.openDevModeConsentDevModeConsentPost.mockResolvedValue({ data: { challenge_id: 'c2', instruction: 'Press the knob', expires_in_seconds: 60 } })
    vm.accepted = true
    await vm.confirmEnable()

    http.post.mockRejectedValue(new Error('Network Error'))
    for (let i = 0; i < 4; i++) await vm.pollConsent()
    expect(vm.awaiting).toBe(true)
    expect(vm.errorMessage).toMatch(/isn't saying whether the knob was pressed/)

    http.post.mockResolvedValue({ data: { result: { challenge_id: 'c2', confirmed: false, refused: true, expires_at: 1 } } })
    await vm.pollConsent()
    expect(vm.awaiting).toBe(false)
    expect(vm.errorMessage).toMatch(/Turned down at the printer/)
    expect(api.setDevModeDevModePost).not.toHaveBeenCalled()
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
