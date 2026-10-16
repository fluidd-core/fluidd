/**
 * @vitest-environment-options { "url": "https://app.muon3d.com/" }
 */
// KAN-414: the console is served as control.muon3d.com beside app.muon3d.com,
// and the hosted Fluidd is one build under both names. The console names
// itself (`iss`, the handoff URL) by one of them, MUON_CONSOLE_URL. These run
// on app.muon3d.com with a build made for control.muon3d.com, the case that
// arrives once the console's URL moves.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { centralLoginEnabled, handoffUrl, redirectUri, startCentralSignIn, takeCallback } from '../centralLogin'
import { cloudBaseUrl, sameConsole } from '../api'

const APP = 'https://app.muon3d.com'
const CONTROL = 'https://control.muon3d.com'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.stubEnv('VUE_MUON_CLOUD_URL', CONTROL)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('a page the console serves under its other name', () => {
  it('talks to the console under the name it was opened by', () => {
    expect(cloudBaseUrl()).toBe(APP)
    expect(redirectUri()).toBe(`${APP}/`)
    expect(centralLoginEnabled({ origin: APP, protocol: 'https:', hostname: 'app.muon3d.com' })).toBe(true)
  })

  it('still follows a console address someone saved', () => {
    localStorage.setItem('muon.cloud.url', 'https://staging-app.muon3d.com/')
    expect(cloudBaseUrl()).toBe('https://staging-app.muon3d.com')
  })

  it('takes a code whose issuer is either name of the console, and no other', async () => {
    for (const iss of [APP, CONTROL, `${CONTROL}/`]) {
      await startCentralSignIn({ silent: false, returnTo: '/' }, vi.fn())
      const pending = JSON.parse(sessionStorage.getItem('muon.cloud.authorize')!)
      expect(takeCallback({ search: `?code=c0de&state=${pending.state}&iss=${encodeURIComponent(iss)}` }).outcome).toBe('code')
    }
    for (const iss of ['https://evil.example', 'https://control.muon3d.com.evil.example', 'http://control.muon3d.com', 'https://staging-app.muon3d.com']) {
      await startCentralSignIn({ silent: false, returnTo: '/' }, vi.fn())
      const pending = JSON.parse(sessionStorage.getItem('muon.cloud.authorize')!)
      expect(takeCallback({ search: `?code=c0de&state=${pending.state}&iss=${encodeURIComponent(iss)}` }).outcome).toBe('error')
    }
  })

  it('stays on this name for the handoff, where the session cookie must land', () => {
    const url = new URL(handoffUrl(`${CONTROL}/handoff?code=h4nd`, '/authorize?client_id=fluidd&state=s'))
    expect(url.origin + url.pathname).toBe(`${APP}/handoff`)
    expect(url.searchParams.get('code')).toBe('h4nd')
    expect(url.searchParams.get('next')).toBe('/authorize?client_id=fluidd&state=s')
  })

  it('refuses a handoff on another console', () => {
    expect(() => handoffUrl('https://staging-app.muon3d.com/handoff?code=h4nd', null)).toThrow('wrong origin')
  })
})

describe('sameConsole', () => {
  it('is one console for its two names, and a host is not its look-alikes', () => {
    expect(sameConsole(APP, CONTROL)).toBe(true)
    expect(sameConsole(`${CONTROL}/`, APP)).toBe(true)
    expect(sameConsole('http://192.168.1.37', 'http://192.168.1.37/')).toBe(true)
    expect(sameConsole(APP, 'https://staging-app.muon3d.com')).toBe(false)
    expect(sameConsole(CONTROL, 'https://control.muon3d.com.evil.example')).toBe(false)
    expect(sameConsole(CONTROL, 'http://control.muon3d.com')).toBe(false)
  })
})
