/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { LIBRARY_RETENTION, retentionRows } from '../retention'
import {
  accountSectionFor,
  accountSections,
  ACCOUNT_SECTIONS,
  agoText,
  clientName,
  dayText,
  deviceCount,
  devicesFrom,
  devicesLine,
  eventLine,
  initialsOf,
  listText,
  methodsLine,
  monthText,
  securityHealth,
  shortKey,
  whenText
} from '../model'
import type { Me, Session } from '../api'

const NOW = new Date(2026, 9, 13, 1, 30).getTime()
const at = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min).getTime() / 1000

function me (sign: Partial<NonNullable<Me['sign_in']>> = {}): Me {
  return {
    account: { id: 'a1', email: 'jack@muon3d.com', name: 'Jack Smith', created_at: at(2026, 9, 14) },
    endpoint_id: null,
    sign_in: { password: true, passkeys: 0, identities: [], two_step: false, ...sign }
  }
}

function session (over: Partial<Session> & { id: string }): Session {
  return {
    device: 'Web browser',
    endpoint_id: null,
    kind: 'legacy',
    client_id: null,
    created_at: at(2026, 10, 1),
    last_used_at: at(2026, 10, 12),
    expires_at: at(2026, 11, 1),
    current: false,
    ...over
  }
}

describe('the account in words', () => {
  it('makes initials from the name, else the address', () => {
    expect(initialsOf('Jack Smith')).toBe('J')
    expect(initialsOf('Jack')).toBe('J')
    expect(initialsOf('  ', 'jedsmith2004@example.com')).toBe('J')
    expect(initialsOf('', 'tamsin.reid@example.com')).toBe('T')
    expect(initialsOf(null, null)).toBe('?')
  })

  it('writes times as the canvas does', () => {
    expect(dayText(at(2026, 10, 11), NOW)).toBe('11 Oct')
    expect(dayText(at(2025, 12, 31), NOW)).toBe('31 Dec 2025')
    expect(whenText(at(2026, 10, 11, 21, 4), NOW)).toBe('11 Oct, 21:04')
    expect(monthText(at(2026, 9, 14))).toBe('September 2026')
    expect(agoText(NOW / 1000 - 30, NOW)).toBe('now')
    expect(agoText(NOW / 1000 - 5 * 60, NOW)).toBe('5 minutes ago')
    expect(agoText(NOW / 1000 - 2 * 3600, NOW)).toBe('2 hours ago')
    expect(agoText(at(2026, 10, 11), NOW)).toBe('11 Oct')
    expect(agoText(null, NOW)).toBe('not since')
  })

  it('lists things in plain English', () => {
    expect(listText([])).toBe('')
    expect(listText(['a'])).toBe('a')
    expect(listText(['a', 'b'])).toBe('a and b')
    expect(listText(['a', 'b', 'c'])).toBe('a, b and c')
  })

  it('sums up the ways to sign in', () => {
    expect(methodsLine(me({ passkeys: 2, two_step: true, identities: ['google'] }))).toBe('2 passkeys · Two-step sign-in on · Google linked · Password set')
    expect(methodsLine(me())).toBe('Two-step sign-in off · Password set')
  })

  it('calls an account with a passkey or two-step and a second way in well protected', () => {
    const good = securityHealth(me({ passkeys: 2, two_step: true, recovery_left: 7 }))
    expect(good.level).toBe('good')
    expect(good.line).toBe('You have 2 passkeys, two-step sign-in is on and 7 recovery codes are left. Nothing to do.')
  })

  it('warns when only a password protects the account', () => {
    expect(securityHealth(me()).level).toBe('weak')
    expect(securityHealth(me()).title).toBe('Only a password protects this account')
  })

  it('asks for a second way in when a passkey is the only one', () => {
    expect(securityHealth(me({ password: false, passkeys: 1 })).level).toBe('fair')
  })

  it('names the central login\'s clients as people know them', () => {
    expect(clientName('fluidd')).toBe('Control')
    expect(clientName('slicer')).toBe('Slice')
    expect(clientName(null)).toBeNull()
  })

  it('shortens a phone key', () => {
    expect(shortKey('7c1e00000000000000000000a94f')).toBe('7c1e…a94f')
    expect(shortKey(null)).toBeNull()
  })
})

describe('devices from sessions', () => {
  it('makes a browser\'s sign-in and the Control and Slice sessions it opened one device', () => {
    const devices = devicesFrom([
      session({ id: 'b1', kind: 'browser', device: 'Web browser', device_label: 'Chrome on Windows', created_at: at(2026, 10, 13, 0, 41) }),
      session({ id: 'r1', kind: 'rotating', client_id: 'fluidd', device: 'Muon3D Fluidd', parent_id: 'b1', current: true, last_used_at: NOW / 1000 }),
      session({ id: 'r2', kind: 'rotating', client_id: 'slicer', device: 'Muon3D Slicer (web)', parent_id: 'b1' }),
      session({ id: 'p1', kind: 'rotating', device: "Jack's iPhone", endpoint_id: '7c1e00000000000000000000a94f' })
    ])
    expect(devices).toHaveLength(2)
    expect(devices[0]).toMatchObject({ label: 'Chrome on Windows', uses: 'Control and Slice', current: true, sessionIds: ['b1', 'r1', 'r2'] })
    expect(devices[1]).toMatchObject({ label: "Jack's iPhone", kind: 'phone', uses: 'Muon3D app', phoneKey: '7c1e…a94f' })
    expect(devicesLine(devices)).toBe("This browser and Jack's iPhone.")
  })

  it('keeps identically labelled sessions separate without a proven parent', () => {
    const devices = devicesFrom([
      session({ id: 'b1', kind: 'browser', device_label: 'Safari on a MacBook' }),
      session({ id: 'r1', kind: 'rotating', client_id: 'fluidd', device_label: 'Safari on a MacBook' })
    ])
    expect(devices).toHaveLength(2)
    expect(devices.find(d => d.id === 'r1')?.sessionIds).toEqual(['r1'])
  })

  it('groups siblings by parent even if the browser session has expired', () => {
    const devices = devicesFrom([
      session({ id: 'slice', kind: 'rotating', client_id: 'slicer', parent_id: 'expired' }),
      session({ id: 'control', kind: 'rotating', client_id: 'fluidd', parent_id: 'expired', current: true }),
      session({ id: 'other', kind: 'rotating', client_id: 'fluidd', parent_id: 'elsewhere' })
    ])
    expect(devices).toHaveLength(2)
    expect(devices[0]).toMatchObject({ current: true, sessionIds: ['slice', 'control'] })
  })

  it('keeps the old sign-in page\'s leftover session apart, marked, and out of the count', () => {
    const devices = devicesFrom([
      session({ id: 'l1', kind: 'legacy', device: 'Muon3D sign-in' }),
      session({ id: 'b1', kind: 'browser', current: true })
    ])
    expect(devices.find(d => d.id === 'l1')).toMatchObject({ leftover: true, label: 'An old web sign-in' })
    expect(deviceCount(devices)).toBe(1)
  })

  it('names a browser with no label plainly, never as the console\'s "Web browser"', () => {
    expect(devicesFrom([session({ id: 'b1', kind: 'browser' })])[0].label).toBe('A web browser')
    expect(devicesFrom([session({ id: 'x', device: 'Unnamed device' })])[0].label).toBe('A device with no name')
  })
})

describe('the account\'s history in words', () => {
  const printer = (id: string) => (id === 'p1' ? 'Boxwood' : 'a printer')

  it.each([
    [{ kind: 'sign_in', detail: { method: 'passkey' } }, 'Signed in with a passkey', 'signIn'],
    [{ kind: 'passkey_added', detail: { name: 'MacBook Touch ID' } }, 'Passkey added: MacBook Touch ID', 'key'],
    [{ kind: 'printer_shared', detail: { printer_id: 'p1', email: 'harry@muon3d.com', role: 'operator' } }, 'You let harry@muon3d.com use Boxwood, as an Operator', 'userPlus'],
    [{ kind: 'two_step_on', detail: {} }, 'Two-step sign-in turned on', 'shield'],
    [{ kind: 'recovery_code_used', detail: { left: 6 } }, 'A recovery code was used; 6 left', 'shield'],
    [{ kind: 'something_new', detail: {} }, 'Something new', 'alert']
  ])('%o is "%s"', (e, text, icon) => {
    expect(eventLine({ id: 'e', at: 0, ...e }, printer)).toEqual({ text, icon })
  })
})

describe('the Account sections', () => {
  it('list only the sections whose pages exist, in the canvas\'s order', () => {
    const ids = accountSections().map(s => s.id)
    expect(ids[0]).toBe('overview')
    expect(ids).toEqual(ACCOUNT_SECTIONS.filter(s => s.built).map(s => s.id))
    expect(ids).toContain('library')
  })

  it('open the overview for an address they don\'t know', () => {
    expect(accountSectionFor('profile').id).toBe('profile')
    expect(accountSectionFor('nonsense').id).toBe('overview')
    expect(accountSectionFor(undefined).id).toBe('overview')
  })
})

describe('the retention statement, as the Privacy page shows it', () => {
  // GET /v1/retention as the console answers it today (muon-console retention.rs).
  const statement = {
    account: 'until you delete it; deletion removes it at once',
    sessions: 'until you sign out or the device is signed out, or 30 days after its last use',
    security_events_days: 90,
    email_tokens: 'until used, or at most three days',
    printers: 'until unlinked, or until the account is deleted',
    backups_days: 30,
    live_activity_tokens_hours: 8,
    job_runs_every_seconds: 3600
  }

  it('names the known keys in words, in the page order, with their units', () => {
    expect(retentionRows(statement).map(r => [r.label, r.value])).toEqual([
      ['Your account, name and email', 'Until you delete it; deletion removes it at once'],
      ['A signed-in device', 'Until you sign out or the device is signed out, or 30 days after its last use'],
      ['Security activity', '90 days'],
      ['A printer linked to your account', 'Until unlinked, or until the account is deleted'],
      ['A link we email you', 'Until used, or at most three days'],
      ['Lock-screen progress on an iPhone', '8 hours'],
      ['Backups', '30 days']
    ])
  })

  it('leaves out how often the job runs, and shows an unknown key as the console says it', () => {
    const rows = retentionRows({ ...statement, scan_uploads: 'a week', nested: { a: 1 }, gone: null })
    expect(rows.some(r => r.key === 'job_runs_every_seconds')).toBe(false)
    expect(rows[rows.length - 1]).toEqual({ key: 'scan_uploads', label: 'Scan uploads', value: 'A week' })
    expect(rows.some(r => r.key === 'nested' || r.key === 'gone')).toBe(false)
  })

  it('has the Library window beside the console ones', () => {
    expect(LIBRARY_RETENTION[0].label).toBe('Library files')
  })
})
