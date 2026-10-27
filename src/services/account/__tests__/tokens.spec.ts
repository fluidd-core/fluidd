import { describe, expect, it } from 'vitest'
import { AccountError } from '../client'
import {
  BYPASS_SOON,
  SCOPE_GROUPS,
  SOON_SCOPES,
  changesThings,
  createBody,
  endsText,
  modeText,
  needsTwoStep,
  orderTokens,
  otherScopes,
  printersText,
  tokenFailure,
  usedText,
  type PersonalToken
} from '../tokens'

const NOW = 1_800_000_000_000
const S = NOW / 1000

function token (extra: Partial<PersonalToken> = {}): PersonalToken {
  return { id: 't', name: 'ci', prefix: 'mpat_Ab3', scopes: ['printers:read'], printer_ids: null, ask_mode: 'ask', expires_at: S + 86400 * 29.5, created_at: S - 100, status: 'active', ...extra }
}

describe('token scopes', () => {
  it('put the scopes that act on the world in the group that asks for a code', () => {
    const power = SCOPE_GROUPS.find(g => g.twoStep)
    expect(power?.scopes.map(s => s.id).sort()).toEqual(['library:publish', 'printers:control'])
  })

  it('name every scope the console offers, once', () => {
    const grantable = ['account:read', 'printers:read', 'printers:files', 'printers:queue', 'printers:control', 'printers:estop', 'printers:camera',
      'library:read', 'library:write', 'library:publish', 'design:read', 'design:write', 'design:export', 'slicer:run']
    const ids = SCOPE_GROUPS.flatMap(g => g.scopes.map(s => s.id))
    expect([...ids].sort()).toEqual([...grantable].sort())
    expect(otherScopes([...grantable, 'robot:dance'])).toEqual(['robot:dance'])
  })

  it('keep Emergency stop out of the look-only group', () => {
    const group = (id: string) => SCOPE_GROUPS.find(g => g.scopes.some(s => s.id === id))?.id
    expect(group('printers:estop')).toBe('change')
    expect(SCOPE_GROUPS.find(g => g.id === 'read')?.scopes.map(s => s.id)).not.toContain('printers:estop')
  })

  it('list control as coming soon, with Bypass', () => {
    expect(SOON_SCOPES).toEqual(['printers:control'])
    expect(BYPASS_SOON).toBe(true)
  })

  it('promise no protection nobody enforces', () => {
    const words = JSON.stringify(SCOPE_GROUPS)
    expect(words).not.toMatch(/still needs your OK/i)
  })

  it('need a code for queue, files, control, publish and Bypass only', () => {
    expect(needsTwoStep(['printers:read', 'library:write'], 'ask')).toBe(false)
    expect(needsTwoStep(['printers:queue'], 'ask')).toBe(true)
    expect(needsTwoStep(['printers:files'], 'ask')).toBe(true)
    expect(needsTwoStep(['printers:control'], 'ask')).toBe(true)
    expect(needsTwoStep(['library:publish'], 'ask')).toBe(true)
    expect(needsTwoStep(['printers:read'], 'bypass')).toBe(true)
  })
})

describe('the create body', () => {
  const form = { name: ' Laptop ', scopes: ['printers:read', 'library:read'], allPrinters: true, printerIds: [], days: 30, bypass: false, bypassHours: 8 as 1 | 8 | null }

  it('leaves printers out for all of them and keeps Ask', () => {
    expect(createBody(form)).toEqual({ name: 'Laptop', scopes: ['library:read', 'printers:read'], expires_in_days: 30, ask_mode: 'ask' })
  })

  it('names the printers chosen, and an empty list stays an empty list', () => {
    expect(createBody({ ...form, allPrinters: false, printerIds: ['a'] }).printer_ids).toEqual(['a'])
    expect(createBody({ ...form, allPrinters: false, printerIds: [] }).printer_ids).toEqual([])
  })

  it('sends bypass_hours only with Bypass, and none for "until the token ends"', () => {
    expect(createBody({ ...form, bypass: true })).toMatchObject({ ask_mode: 'bypass', bypass_hours: 8 })
    expect(createBody({ ...form, bypass: true, bypassHours: null })).not.toHaveProperty('bypass_hours')
    expect(createBody({ ...form, bypass: false })).not.toHaveProperty('bypass_hours')
  })
})

describe('token words', () => {
  it('say which printers', () => {
    const name = (id: string) => id.toUpperCase()
    expect(printersText({ printer_ids: null }, name)).toBe('All your printers')
    expect(printersText({ printer_ids: [] }, name)).toBe('No printers')
    expect(printersText({ printer_ids: ['a', 'b'] }, name)).toBe('A and B')
    expect(printersText({ printer_ids: ['a', 'b', 'c'] }, name)).toBe('3 printers')
  })

  it('say when it ends and when it was used', () => {
    expect(endsText(token(), NOW)).toBe('Ends in 30 days')
    expect(endsText(token({ expires_at: S + 3600 }), NOW)).toBe('Ends today')
    expect(endsText(token({ status: 'expired', expires_at: S - 86400 }), NOW)).toMatch(/^Ended /)
    expect(endsText(token({ status: 'revoked', revoked_at: S - 60 }), NOW)).toMatch(/^Revoked /)
    expect(usedText({ last_used_at: null }, NOW)).toBe('Never used')
    expect(usedText({ last_used_at: S - 600 }, NOW)).toBe('Used 10 minutes ago')
  })

  it('say Ask or Bypass, and that a spent Bypass is back to Ask', () => {
    expect(modeText({ ask_mode: 'ask' }, NOW)).toBe('Ask mode')
    expect(modeText({ ask_mode: 'bypass', bypass_until: null }, NOW)).toBe('Skips the click')
    expect(modeText({ ask_mode: 'bypass', bypass_until: S + 3600 }, NOW)).toMatch(/^Skips the click until /)
    expect(modeText({ ask_mode: 'bypass', bypass_until: S - 3600 }, NOW)).toContain('Bypass ended')
  })

  it('list working tokens first, newest first', () => {
    const list = orderTokens([
      token({ id: 'old', created_at: 1 }),
      token({ id: 'dead', status: 'revoked', created_at: 99 }),
      token({ id: 'new', created_at: 50 })
    ])
    expect(list.map(t => t.id)).toEqual(['new', 'old', 'dead'])
  })
})

describe('token errors', () => {
  const fail = (status: number, body: Record<string, unknown>) => tokenFailure(new AccountError('Console words.', status, body))

  it('tell a token that tried the token routes why', () => {
    expect(fail(403, { code: 'interactive_only' }).kind).toBe('interactive')
  })

  it('send an account without two-step to turn it on', () => {
    expect(fail(403, { code: 'second_factor_required', reauth_required: true })).toMatchObject({ kind: 'two-step' })
  })

  it('say to wait on 429 and to revoke one at the limit', () => {
    expect(fail(429, { code: 'rate_limited' }).text).toMatch(/wait/i)
    expect(fail(409, { code: 'too_many_tokens' }).text).toMatch(/revoke/i)
  })

  it('say plainly that a refused option is not available yet (409 not_available_yet)', () => {
    for (const body of [{ code: 'not_available_yet' }, { type: 'urn:x:not_available_yet' }, { error: 'not_available_yet' }]) {
      const out = fail(409, body)
      expect(out.kind).toBe('soon')
      expect(out.text).toMatch(/isn't available yet/)
    }
    expect(fail(409, { code: 'too_many_tokens' }).kind).toBe('limit')
  })

  it('keep the console words otherwise', () => {
    expect(fail(400, { error: 'x' }).text).toBe('Console words.')
    expect(tokenFailure(new Error('boom')).text).toMatch(/try again/i)
  })
})

describe('wording that must stay true', () => {
  it('knows which scopes change things', () => {
    expect(changesThings(['printers:read', 'library:read'])).toBe(false)
    expect(changesThings(['printers:read', 'printers:queue'])).toBe(true)
  })

  it('does not say a token can start prints and not heat or move in the same breath', () => {
    const change = SCOPE_GROUPS.find(g => g.id === 'change')!
    expect(change.blurb).toMatch(/outside a print/i)
    expect(change.blurb).not.toMatch(/^.*stop a print\. Can't heat/)
  })
})
