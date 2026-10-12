import { describe, expect, it } from 'vitest'
import { consentAnswerOf, consentProxyRequest } from '../consent'

describe("the knob's answer", () => {
  it('is asked through Moonraker\'s proxy, since the route has the challenge in its path', () => {
    expect(consentProxyRequest('Zx9_-a1')).toEqual({ path: '/dev_mode/consent/Zx9_-a1', method: 'GET' })
  })

  it('never sends an id that could name another route', () => {
    for (const bad of ['../dev_mode', 'a/b', 'a%2Fb', '', 'x?y=1']) expect(() => consentProxyRequest(bad)).toThrow()
  })

  it('reads Moonraker\'s reply, or Aux\'s own', () => {
    expect(consentAnswerOf({ result: { challenge_id: 'a', confirmed: true, expires_at: 1 } })).toEqual({ confirmed: true, refused: false })
    expect(consentAnswerOf({ confirmed: false, refused: true })).toEqual({ confirmed: false, refused: true })
    expect(consentAnswerOf({ result: 'ok' })).toBeNull()
    expect(consentAnswerOf(null)).toBeNull()
  })
})
