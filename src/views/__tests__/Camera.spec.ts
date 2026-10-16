import { shallowMount, type Wrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import Camera, { redactCameraUrl } from '../Camera.vue'
import type { WebcamConfig } from '@/store/webcams/types'

const front: WebcamConfig = {
  uid: 'front',
  name: 'Front camera',
  source: 'database',
  service: 'webrtc-go2rtc',
  stream_url: 'https://viewer:secret@camera.local/live?token=private&quality=high',
  snapshot_url: '/webcam/snapshot?access_token=private',
  target_fps: 30,
  target_fps_idle: 5,
  rotation: 90,
  flip_horizontal: true
}

const side: WebcamConfig = {
  uid: 'side',
  name: 'Side camera',
  source: 'config'
}

function mountCamera (cameras: WebcamConfig[], cameraId = cameras[0]?.uid): Wrapper<Camera> {
  return shallowMount(Camera, {
    mocks: {
      $vuetify: { breakpoint: { mobile: false } },
      $store: {
        getters: {
          'webcams/getEnabledWebcams': cameras,
          'server/componentSupport': () => false,
          'config/getDisplayName': 'M1'
        },
        state: { printer: { printer: {} }, config: { uiSettings: {} } }
      }
    },
    computed: {
      cameras: () => cameras,
      camera: () => cameras.find(camera => camera.uid === cameraId) ?? cameras[0] ?? null,
      isMobileViewport: () => false,
      facts: () => '',
      hasLights: () => false,
      printerPrinting: () => false,
      printerPaused: () => false
    },
    stubs: ['camera-item', 'camera-actions', 'frame-icon', 'router-link'],
    attachTo: document.body
  })
}

afterEach(() => localStorage.setItem('muon3d.pro', '0'))

describe('Camera stream details', () => {
  for (const legacyPro of [false, true]) {
    it(`makes details reachable when legacy Pro is ${legacyPro}`, async () => {
      localStorage.setItem('muon3d.pro', legacyPro ? '1' : '0')
      const wrapper = mountCamera([front])
      const button = wrapper.get('[data-tid="camera-details-trigger"]')
      expect(wrapper.text()).not.toContain('Pro shows')
      expect(button.attributes('aria-expanded')).toBe('false')
      expect(button.attributes('aria-controls')).toBe('camera-details')

      await button.trigger('click')

      expect(button.attributes('aria-expanded')).toBe('true')
      expect(wrapper.get('#camera-details').text()).toContain('webrtc-go2rtc')
      expect(wrapper.get('#camera-details').text()).toContain('30 fps, 5 idle')
      expect(wrapper.get('#camera-details').text()).not.toContain('secret')
      expect(wrapper.get('#camera-details').text()).not.toContain('private')
      wrapper.destroy()
    })
  }

  it('closes with Escape and returns focus to its native trigger', async () => {
    const wrapper = mountCamera([front])
    const button = wrapper.get('[data-tid="camera-details-trigger"]')
    ;(button.element as HTMLButtonElement).focus()
    await button.trigger('click')
    await wrapper.get('#camera-details').trigger('keydown.esc')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(button.element)
    wrapper.destroy()
  })

  it('shows unknown rather than blank for a camera without details', async () => {
    const wrapper = mountCamera([side])
    await wrapper.get('[data-tid="camera-details-trigger"]').trigger('click')
    expect(wrapper.findAll('#camera-details dd').wrappers.map(value => value.text())).toEqual([
      'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown'
    ])
    wrapper.destroy()
  })

  it('distinguishes an upright camera from missing turn information', async () => {
    const upright: WebcamConfig = {
      ...side,
      rotation: 0,
      flip_horizontal: false,
      flip_vertical: false
    }
    const wrapper = mountCamera([upright])
    await wrapper.get('[data-tid="camera-details-trigger"]').trigger('click')
    expect(wrapper.findAll('#camera-details dd').at(4).text()).toBe('Not turned')
    wrapper.destroy()
  })

  it('shows the selected camera when several cameras are available', async () => {
    const wrapper = mountCamera([front, side], 'side')
    await wrapper.get('[data-tid="camera-details-trigger"]').trigger('click')
    expect(wrapper.get('#camera-details').text()).not.toContain('webrtc-go2rtc')
    wrapper.destroy()
  })

  it('closes when clicking outside the details bar', async () => {
    const wrapper = mountCamera([front])
    const button = wrapper.get('[data-tid="camera-details-trigger"]')
    await button.trigger('click')
    document.body.click()
    await wrapper.vm.$nextTick()
    expect(button.attributes('aria-expanded')).toBe('false')
    wrapper.destroy()
  })

  it('redacts usernames, passwords, hashes, and every query value', () => {
    const https = redactCameraUrl('https://viewer:secret@camera.local/live?token=private&quality=high#token')
    expect(https).toBe('https://camera.local/live?token=[redacted]&quality=[redacted]')
    expect(https).not.toContain('viewer')
    expect(https).not.toContain('#token')
    expect(redactCameraUrl('rtsp://user:pass@camera.local/live')).toBe('rtsp://camera.local/live')
  })
})
