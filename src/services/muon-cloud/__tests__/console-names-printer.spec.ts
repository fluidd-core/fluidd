/**
 * @vitest-environment-options { "url": "http://192.168.1.37/" }
 */
// KAN-414: on a printer, Fluidd's page is the printer's, so the console is the
// one the build names. Only a page the console itself serves uses its own
// origin.
import { afterEach, expect, it, vi } from 'vitest'
import { centralLoginEnabled } from '../centralLogin'
import { cloudBaseUrl } from '../api'

afterEach(() => {
  vi.unstubAllEnvs()
  localStorage.clear()
})

it.each([
  ['https://app.muon3d.com', 'https://app.muon3d.com'],
  ['https://control.muon3d.com/', 'https://control.muon3d.com']
])('a printer\'s Fluidd built for %s reaches that console', (configured, expected) => {
  vi.stubEnv('VUE_MUON_CLOUD_URL', configured)
  expect(cloudBaseUrl()).toBe(expected)
  expect(centralLoginEnabled()).toBe(false)
})
