import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'
import { beforeEach, expect, it } from 'vitest'

const script = readFileSync(resolve('public/auth/logout.js'), 'utf8')
const origin = 'https://control.muon3d.com'
const keys = ['muon.cloud.token', 'muon.cloud.refresh', 'muon.cloud.active', 'muon.cloud.key']

beforeEach(() => {
  localStorage.clear()
  for (const key of keys) localStorage.setItem(key, 'saved')
  localStorage.setItem('printer-setting', 'kept')
})

function load (issuer: string, referrer: string, framed = true, own = origin) {
  const frame: any = { location: { origin: own, search: `?iss=${encodeURIComponent(issuer)}` }, localStorage }
  frame.parent = framed ? {} : frame
  runInNewContext(script, { window: frame, document: { referrer }, URL, URLSearchParams })
}

// KAN-414: the console has two names and names itself by one of them, so the
// page on either name accepts either as the issuer. The frame must still come
// from the page's own name: signing out on one name ends that name's session.
it.each([
  ['https://app.muon3d.com', origin],
  [origin, 'https://app.muon3d.com'],
  ['https://app.muon3d.com/', 'https://app.muon3d.com']
])('clears the session when the console names itself %s and the page is %s', (issuer, own) => {
  load(issuer, `${own}/logout`, true, own)
  for (const key of keys) expect(localStorage.getItem(key)).toBeNull()
})

it.each([
  ['https://app.muon3d.com', 'https://app.muon3d.com/logout', 'https://staging-app.muon3d.com'],
  ['https://staging-app.muon3d.com', `${origin}/logout`, origin],
  ['https://app.muon3d.com', `${origin}/logout`, 'https://app.muon3d.com']
])('ignores issuer %s framed by %s on %s', (issuer, referrer, own) => {
  load(issuer, referrer, true, own)
  expect(localStorage.getItem('muon.cloud.token')).toBe('saved')
})

it('clears the Fluidd session when the console frames its logout page', () => {
  load(origin, `${origin}/logout`)
  for (const key of keys) expect(localStorage.getItem(key)).toBeNull()
  expect(localStorage.getItem('printer-setting')).toBe('kept')
})

it.each([
  ['https://evil.test', `${origin}/logout`, true],
  [origin, 'https://evil.test/logout', true],
  [origin, '', true],
  [origin, `${origin}/logout`, false]
])('ignores an unrelated logout request', (issuer, referrer, framed) => {
  load(issuer as string, referrer as string, framed as boolean)
  expect(localStorage.getItem('muon.cloud.token')).toBe('saved')
})
