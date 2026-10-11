import { enableAutoDestroy, shallowMount } from '@vue/test-utils'
import Vue from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HotspotManagerCard from '../HotspotManagerCard.vue'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'

const apShowCredentials = vi.fn()
const apDeviceStatus = vi.fn()
const apModify = vi.fn()
const apUp = vi.fn()
const apDown = vi.fn()

vi.mock('@/aux_api/useAuxApi', () => ({
  useAuxApi: () => ({
    ap: {
      wifiStatusWifiApDeviceStatusGet: apDeviceStatus,
      apShowCredentialsWifiApShowGet: apShowCredentials,
      apModifyWifiApModifyPost: apModify,
      apUpWifiApUpPost: apUp,
      apDownWifiApDownPost: apDown
    }
  })
}))

// The card reads this at import; a test sets `value` to put the page on the
// printer's hotspot.
const hotspot = vi.hoisted(() => ({ value: false }))
vi.mock('@/aux_api/useHotspotCheck', () => ({
  useHotspotCheck: () => ({ onHotspot: hotspot })
}))

const emit = vi.fn()
vi.mock('@/eventBus', () => ({
  EventBus: { $emit: (...args: unknown[]) => emit(...args) }
}))

const dispatch = vi.fn()

/** `locked`: MuonOS network protection is on and this browser has no identity. */
const mocks = (locked = false) => ({
  $t: (key: string) => key,
  $store: { getters: { 'protection/isLocked': locked }, dispatch }
})

/** Moonraker's refusal, as axios hands it to the card. */
const refused = (message: string) => Object.assign(new Error('Request failed with status code 403'), {
  response: { status: 403, statusText: 'Forbidden', data: { error: { code: 403, message } } }
})

// A card polls on a real interval until destroyed. Without this, a wrapper
// from one test keeps calling the Aux API during the next.
enableAutoDestroy(afterEach)

describe('HotspotManagerCard', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    hotspot.value = false
    apModify.mockResolvedValue({ data: { status: 'modified', ssid: 'Muon-M1' } })
    apUp.mockResolvedValue({ data: { status: 'activation-requested' } })
    apDown.mockResolvedValue({ data: { status: 'deactivation-requested' } })
    apDeviceStatus.mockResolvedValue({
      data: {
        device: 'ap0',
        device_type: 'wifi',
        state: 'connected',
        connection: 'ap0-con'
      }
    })
    apShowCredentials.mockResolvedValue({
      data: {
        ssid: 'Muon-M1',
        password: null,
        autoconnect: true,
        security_enabled: true
      }
    })
  })

  it('reflects an unsecured hotspot reported by the API', async () => {
    apShowCredentials.mockResolvedValueOnce({
      data: {
        ssid: 'Muon-M1',
        password: null,
        autoconnect: true,
        security_enabled: false
      }
    })
    const wrapper = shallowMount(HotspotManagerCard, {
      mocks: mocks()
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    expect((wrapper.vm as any).form.securityEnabled).toBe(false)
  })

  it('hides an entered password until the reveal control is used', async () => {
    const wrapper = shallowMount(HotspotManagerCard, {
      mocks: mocks()
    })
    await new Promise(resolve => setTimeout(resolve, 0))

    const passwordField = wrapper.findAll('v-text-field-stub').at(1)
    expect(passwordField.attributes('type')).toBe('password')

    passwordField.vm.$emit('click:append', new MouseEvent('click'))
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('v-text-field-stub').at(1).attributes('type')).toBe('text')
  })

  it('updates the hotspot switch when the device changes outside Fluidd', async () => {
    vi.useFakeTimers()
    apDeviceStatus
      .mockResolvedValueOnce({
        data: {
          device: 'ap0',
          device_type: 'wifi',
          state: 'connected',
          connection: 'ap0-con'
        }
      })
      .mockResolvedValueOnce({
        data: {
          device: 'ap0',
          device_type: 'wifi',
          state: 'disconnected',
          connection: null
        }
      })
    const wrapper = shallowMount(HotspotManagerCard, {
      mocks: mocks()
    })

    await vi.advanceTimersByTimeAsync(0)
    await wrapper.vm.$nextTick()
    expect((wrapper.vm as any).apState).toBe(true)

    await vi.advanceTimersByTimeAsync(1000)
    await wrapper.vm.$nextTick()

    expect((wrapper.vm as any).apState).toBe(false)
    wrapper.destroy()
    vi.useRealTimers()
  })

  it('does not rewrite or reload hotspot credentials just to turn it off', async () => {
    const wrapper = shallowMount(HotspotManagerCard, {
      mocks: mocks()
    })
    await new Promise(resolve => setTimeout(resolve, 10))
    await wrapper.vm.$nextTick()

    await (wrapper.vm as any).confirmToggle()

    expect(apDown).toHaveBeenCalledTimes(1)
    expect(apModify).not.toHaveBeenCalled()
    expect(apShowCredentials).toHaveBeenCalledTimes(1)
    expect((wrapper.vm as any).apState).toBe(false)
  })

  it('keeps the password setter enabled when the API redacts the current password', async () => {
    const wrapper = shallowMount(HotspotManagerCard, {
      mocks: mocks()
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect((wrapper.vm as any).form).toEqual({
      ssid: 'Muon-M1',
      password: '',
      securityEnabled: true
    })
  })

  it('keeps the password setter enabled after saving a new password', async () => {
    const wrapper = shallowMount(HotspotManagerCard, {
      mocks: mocks()
    })
    await new Promise(resolve => setTimeout(resolve, 0))

    const card = wrapper.vm as any
    card.form.password = 'new-password'
    await card.$nextTick()
    await card.applyChanges()
    await card.$nextTick()

    expect(apModify).toHaveBeenCalledWith({
      ssid: 'Muon-M1',
      password: 'new-password'
    })
    expect(card.form.securityEnabled).toBe(true)
  })

  it('queues hotspot activation only once after saving while it is off', async () => {
    apDeviceStatus.mockResolvedValue({
      data: {
        device: 'ap0',
        device_type: 'wifi',
        state: 'disconnected',
        connection: null
      }
    })
    const wrapper = shallowMount(HotspotManagerCard, {
      mocks: mocks()
    })
    await new Promise(resolve => setTimeout(resolve, 0))

    const card = wrapper.vm as any
    card.form.password = 'new-password'
    await card.$nextTick()
    await card.confirmApply()

    expect(apModify).toHaveBeenCalledTimes(1)
    expect(apUp).toHaveBeenCalledTimes(1)
  })

  describe('under network protection (SEC-8)', () => {
    it('says it is protected, and asks the Aux API nothing', async () => {
      vi.useFakeTimers()
      const wrapper = shallowMount(HotspotManagerCard, {
        mocks: mocks(true)
      })
      await vi.advanceTimersByTimeAsync(3000)

      expect(wrapper.find('protectednotice-stub').exists()).toBe(true)
      expect(wrapper.find('[data-tid=hotspot-body]').exists()).toBe(false)
      expect(wrapper.find('[data-tid=hotspot-switch]').attributes('disabled')).toBe('true')
      expect(apDeviceStatus).not.toHaveBeenCalled()
      expect(apShowCredentials).not.toHaveBeenCalled()
      wrapper.destroy()
    })

    it('disables the switch when protection comes on after the card has loaded', async () => {
      const $store = Vue.observable({ getters: { 'protection/isLocked': false }, dispatch })
      const wrapper = shallowMount(HotspotManagerCard, {
        mocks: { $t: (key: string) => key, $store }
      })
      await new Promise(resolve => setTimeout(resolve, 10))
      expect(wrapper.find('[data-tid=hotspot-switch]').attributes('disabled')).toBeUndefined()

      $store.getters['protection/isLocked'] = true
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-tid=hotspot-switch]').attributes('disabled')).toBe('true')
      expect(wrapper.find('protectednotice-stub').exists()).toBe(true)
      wrapper.destroy()
    })

    it('loads the hotspot settings it skipped once protection comes off', async () => {
      // Mounted while locked, the card never asked for its settings. The status
      // poll resumes on its own, but only reads the state, so without this the
      // SSID stayed empty and the switch disabled until the page was reloaded.
      const $store = Vue.observable({ getters: { 'protection/isLocked': true }, dispatch })
      const wrapper = shallowMount(HotspotManagerCard, { mocks: { $t: (key: string) => key, $store } })
      await new Promise(resolve => setTimeout(resolve, 10))
      expect(apShowCredentials).not.toHaveBeenCalled()

      $store.getters['protection/isLocked'] = false
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(apShowCredentials).toHaveBeenCalledTimes(1)
      expect((wrapper.vm as any).apCredentials?.ssid).toBe('Muon-M1')
    })

    it('does not toast a refused load nobody asked for', async () => {
      // Opening the Wi-Fi page directly can mount the card before the level has
      // arrived. The refusal is expected; the notice explains it a moment later.
      apDeviceStatus.mockRejectedValue(refused("'/server/aux/wifi/ap/device/status' is protected on this printer."))
      shallowMount(HotspotManagerCard, { mocks: mocks() })
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(emit).not.toHaveBeenCalled()
      expect(dispatch).toHaveBeenCalledWith('protection/onRefused')
    })

    it("shows Moonraker's reason when a toggle is refused, and asks for the level again", async () => {
      const reason = "'/server/aux/wifi/ap/down' is protected on this printer."
      apDown.mockRejectedValueOnce(refused(reason))
      const wrapper = shallowMount(HotspotManagerCard, { mocks: mocks() })
      await new Promise(resolve => setTimeout(resolve, 10))

      await (wrapper.vm as any).confirmToggle()

      expect(emit).toHaveBeenCalledWith(
        `app.wifi.msg.hotspot.toggle_error ${reason}`,
        { type: 'error', timeout: 5000 }
      )
      expect(dispatch).toHaveBeenCalledWith('protection/onRefused')
      expect((wrapper.vm as any).apState).toBe(true)
      wrapper.destroy()
    })
  })

  describe('join code', () => {
    const credentials = (data: Record<string, unknown>) => {
      apShowCredentials.mockResolvedValueOnce({ data: { ssid: 'Muon-M1', autoconnect: true, ...data } })
    }

    const mounted = async () => {
      const wrapper = shallowMount(HotspotManagerCard, { mocks: mocks() })
      await new Promise(resolve => setTimeout(resolve, 0))
      await wrapper.vm.$nextTick()
      return wrapper
    }

    it('draws none for a secured hotspot whose key the API redacts, and says where it is', async () => {
      credentials({ password: null, security_enabled: true })
      const wrapper = await mounted()

      // Never T:nopass: that would send a phone to an open network that does not exist.
      expect((wrapper.vm as any).QrValue).toBe('')
      expect(wrapper.find('qrcode-vue-stub').exists()).toBe(false)
      expect(wrapper.text()).toContain('app.wifi.hotspot_code_on_printer')
    })

    it('draws none when the API says neither the key nor whether one is set', async () => {
      credentials({ password: null })
      const wrapper = await mounted()

      expect((wrapper.vm as any).QrValue).toBe('')
    })

    it('draws none, and never shows the key, when an older Aux returns it (07 S1)', async () => {
      credentials({ password: 'secret-key' })
      const wrapper = await mounted()

      expect((wrapper.vm as any).QrValue).toBe('')
      expect(wrapper.find('qrcode-vue-stub').exists()).toBe(false)
      expect((wrapper.vm as any).form.password).toBe('')
      expect(wrapper.html()).not.toContain('secret-key')
    })

    it('draws an open-network code, escaped, only for a hotspot the API says is open', async () => {
      apShowCredentials.mockResolvedValueOnce({
        data: { ssid: 'Muon;M1', password: null, autoconnect: true, security_enabled: false }
      })
      const wrapper = await mounted()

      expect((wrapper.vm as any).QrValue).toBe('WIFI:S:Muon\\;M1;T:nopass;H:false;;')
      expect(wrapper.find('qrcode-vue-stub').exists()).toBe(true)
      expect(wrapper.text()).not.toContain('app.wifi.hotspot_code_on_printer')
    })
  })

  describe('on the printer\'s hotspot', () => {
    it('asks before turning the hotspot off, and says why', async () => {
      hotspot.value = true
      const wrapper = shallowMount(HotspotManagerCard, { mocks: mocks() })
      await new Promise(resolve => setTimeout(resolve, 10))

      await (wrapper.vm as any).requestToggle()
      await wrapper.vm.$nextTick()

      expect(apDown).not.toHaveBeenCalled()
      expect((wrapper.vm as any).showToggleWarningDialog).toBe(true)
      // The dialog only opens on the hotspot, so its warning must not be
      // hidden there (it was, behind v-if="!onHotspot").
      expect(wrapper.text()).toContain('app.wifi.modal.warning.message')
    })

    it('turns the hotspot off at once from anywhere else', async () => {
      const wrapper = shallowMount(HotspotManagerCard, { mocks: mocks() })
      await new Promise(resolve => setTimeout(resolve, 10))

      await (wrapper.vm as any).requestToggle()

      expect(apDown).toHaveBeenCalledTimes(1)
      expect((wrapper.vm as any).showToggleWarningDialog).toBe(false)
    })
  })
})

describe('HotspotManagerCard over Iroh (07 §3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    apDeviceStatus.mockResolvedValue({ data: { device: 'ap0', device_type: 'wifi', state: 'connected', connection: 'ap0-con' } })
    apShowCredentials.mockResolvedValue({ data: { ssid: 'Muon-M1', password: null, autoconnect: true, security_enabled: true } })
  })

  afterEach(() => {
    printerTransportBinding.remote = false
    vi.useRealTimers()
  })

  it('shows one line in place of the card, and asks the printer nothing', async () => {
    printerTransportBinding.remote = true
    const wrapper = shallowMount(HotspotManagerCard, { mocks: mocks() })
    await vi.advanceTimersByTimeAsync(5000)

    expect(wrapper.text()).toContain('app.wifi.remote_read_only')
    expect(apDeviceStatus).not.toHaveBeenCalled()
    expect(apShowCredentials).not.toHaveBeenCalled()
    expect(wrapper.findAll('v-text-field-stub').length).toBe(0)
    wrapper.destroy()
  })

  it('loads once the printer is reached on its own network again', async () => {
    printerTransportBinding.remote = true
    const wrapper = shallowMount(HotspotManagerCard, { mocks: mocks() })
    await vi.advanceTimersByTimeAsync(0)

    printerTransportBinding.remote = false
    await vi.advanceTimersByTimeAsync(0)

    expect(apShowCredentials).toHaveBeenCalledTimes(1)
    wrapper.destroy()
  })
})
