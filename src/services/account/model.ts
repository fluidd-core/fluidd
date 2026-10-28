/**
 * What the Account pages say (KAN-532), worked out from the console's
 * answers: plain functions, so the pages only lay them out and the rules are
 * tested here. Times from the console are seconds since the epoch.
 */
import type { AccountEvent, Me, Session } from './api'

/** Public Library origins that may send somebody to Account and receive them back. */
export const LIBRARY_RETURN_HOSTS = ['library.muon3d.com', 'staging.library.muon3d.com'] as const

/**
 * Accept an absolute, encrypted Library return address only. Parsing the URL
 * (rather than comparing strings) rejects userinfo and protocol-relative URL tricks.
 */
export function libraryReturnUrl (value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password &&
      (LIBRARY_RETURN_HOSTS as readonly string[]).includes(url.hostname) && url.port === ''
      ? url.href
      : null
  } catch {
    return null
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const two = (n: number) => String(n).padStart(2, '0')

/** One initial for an avatar, from the name or the address. */
export function initialsOf (name: string | null | undefined, email?: string | null): string {
  const source = (name || '').trim() || (email || '').split('@')[0] || '?'
  const words = source.split(/[\s._-]+/).filter(Boolean)
  if (!words.length) return '?'
  return Array.from(words[0])[0].toUpperCase()
}

/** "11 Oct", with the year when it isn't this one. */
export function dayText (seconds: number, now: number = Date.now()): string {
  const d = new Date(seconds * 1000)
  const year = d.getFullYear() === new Date(now).getFullYear() ? '' : ` ${d.getFullYear()}`
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${year}`
}

/** "11 Oct, 21:04". */
export function whenText (seconds: number, now: number = Date.now()): string {
  const d = new Date(seconds * 1000)
  return `${dayText(seconds, now)}, ${two(d.getHours())}:${two(d.getMinutes())}`
}

/** "September 2026". */
export function monthText (seconds: number): string {
  const d = new Date(seconds * 1000)
  return `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`
}

/** "now", "5 minutes ago", "2 hours ago", "11 Oct". */
export function agoText (seconds: number | null | undefined, now: number = Date.now()): string {
  if (!seconds) return 'not since'
  const minutes = Math.max(0, Math.round((now / 1000 - seconds) / 60))
  if (minutes < 2) return 'now'
  if (minutes < 60) return `${minutes} minutes ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return hours === 1 ? 'an hour ago' : `${hours} hours ago`
  return dayText(seconds, now)
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

const PROVIDERS: Record<string, string> = { apple: 'Apple', google: 'Google' }

export function providerName (provider: string): string {
  return PROVIDERS[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1)
}

/** "2 passkeys · Two-step sign-in on · Google linked · Password set". */
export function methodsLine (me: Me): string {
  const s = me.sign_in
  if (!s) return me.account.has_password ? 'Password set' : ''
  const parts: string[] = []
  if (s.passkeys) parts.push(plural(s.passkeys, 'passkey'))
  parts.push(s.two_step ? 'Two-step sign-in on' : 'Two-step sign-in off')
  for (const p of s.identities) parts.push(`${providerName(p)} linked`)
  if (s.password) parts.push('Password set')
  return parts.join(' · ')
}

export type Health = 'good' | 'fair' | 'weak'

export interface SecurityHealth {
  level: Health;
  /** "Well protected". */
  title: string;
  /** What's there, or what to do. */
  line: string;
}

/**
 * How well the account is protected. Good: a passkey or two-step sign-in,
 * and more than one way in, so losing a phone doesn't lock the person out.
 * Weak: a password and nothing else.
 */
export function securityHealth (me: Me): SecurityHealth {
  const s = me.sign_in ?? { password: !!me.account.has_password, passkeys: 0, identities: [], two_step: !!me.account.two_step }
  const ways = (s.password ? 1 : 0) + s.passkeys + s.identities.length
  const strong = s.passkeys > 0 || s.two_step
  if (strong && ways >= 2) {
    const have: string[] = []
    if (s.passkeys) have.push(plural(s.passkeys, 'passkey'))
    if (s.two_step) have.push('two-step sign-in is on')
    if (s.two_step && typeof s.recovery_left === 'number') have.push(`${s.recovery_left} recovery ${s.recovery_left === 1 ? 'code is' : 'codes are'} left`)
    return { level: 'good', title: 'Well protected', line: `${listText(have).replace(/^./, c => c.toUpperCase())}.` }
  }
  if (!strong) {
    return { level: 'weak', title: 'Only a password protects this account', line: 'Anyone who learns it can reach your printers. Add a passkey or turn on two-step sign-in.' }
  }
  return { level: 'fair', title: 'One way in', line: 'Add a second way to sign in.' }
}

/** "a, b and c". */
export function listText (items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/** A client of the central login, as people know it. */
export function clientName (clientId: string | null | undefined): string | null {
  switch (clientId) {
    case 'fluidd': return 'Control'
    case 'slicer': return 'Slice'
    case 'models': return 'Muon3D models'
    case 'library': return 'Library'
    default: return clientId || null
  }
}

export type DeviceKind = 'browser' | 'phone' | 'computer'

/** One device, as the Devices page lists it: a browser's sign-in and what it opened, or an app. */
export interface Device {
  id: string;
  label: string;
  kind: DeviceKind;
  /** "Control and Slice", "Muon3D app". */
  uses: string;
  current: boolean;
  signedInAt: number;
  lastUsedAt: number | null;
  /** The short form of the phone's Iroh key, for an app (APP-44). */
  phoneKey: string | null;
  /** Every session that signing this device out ends. */
  sessionIds: string[];
  /** A legacy session the old sign-in page left behind (KAN-532): it ends by itself. */
  leftover: boolean;
}

const PHONE = /iphone|ipad|android|pixel|galaxy|phone/i

function kindOf (s: Session): DeviceKind {
  if (s.kind === 'browser' || s.client_id) return 'browser'
  return PHONE.test(s.device_label || s.device) ? 'phone' : 'computer'
}

function labelOf (s: Session): string {
  if (s.device_label) return s.device_label
  if (s.kind === 'browser' || s.device === 'Web browser') return 'A web browser'
  if (s.device === 'Unnamed device') return 'A device with no name'
  return s.device
}

/** `7c1e…a94f`. */
export function shortKey (key: string | null | undefined): string | null {
  if (!key) return null
  return key.length > 10 ? `${key.slice(0, 4)}…${key.slice(-4)}` : key
}

/**
 * The account's sessions as devices. A browser's central sign-in and the
 * Control and Slice sessions it opened are one device: grouped by
 * `parent_id`. Labels are descriptions, never device identities.
 * The session the old sign-in page left behind ("Muon3D sign-in")
 * is its own row, marked, so it can still be signed out.
 */
export function devicesFrom (sessions: Session[]): Device[] {
  const devices: Device[] = []
  const byParent = new Map<string, Device>()
  const ordered = [...sessions].sort((a, b) => (a.kind === 'browser' ? 0 : 1) - (b.kind === 'browser' ? 0 : 1) || a.created_at - b.created_at)
  for (const s of ordered) {
    const root = s.parent_id || s.id
    const into = byParent.get(root)
    const client = clientName(s.client_id)
    if (into) {
      into.sessionIds.push(s.id)
      if (client && !into.uses.includes(client)) into.uses = into.uses ? `${into.uses} and ${client}` : client
      into.current = into.current || s.current
      into.lastUsedAt = Math.max(into.lastUsedAt ?? 0, s.last_used_at ?? 0) || null
      continue
    }
    const kind = kindOf(s)
    const leftover = s.kind === 'legacy' && s.device === 'Muon3D sign-in'
    const device: Device = {
      id: s.id,
      label: leftover ? 'An old web sign-in' : labelOf(s),
      kind,
      uses: leftover ? 'Ends by itself' : client ?? (kind === 'browser' ? '' : 'Muon3D app'),
      current: s.current,
      signedInAt: s.created_at,
      lastUsedAt: s.last_used_at,
      phoneKey: kind === 'browser' ? null : shortKey(s.endpoint_id),
      sessionIds: [s.id],
      leftover
    }
    devices.push(device)
    byParent.set(root, device)
  }
  // This device first, then the most recently used.
  return devices.sort((a, b) => Number(b.current) - Number(a.current) || (b.lastUsedAt ?? b.signedInAt) - (a.lastUsedAt ?? a.signedInAt))
}

/** The devices, not the sessions or the leftovers, in words: "This browser, Jack's iPhone and a MacBook." */
export function devicesLine (devices: Device[]): string {
  const names = devices.filter(d => !d.leftover).map(d => d.current ? 'this browser' : d.label)
  const text = listText(names)
  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}.` : ''
}

/** How many devices are signed in, the leftovers aside. */
export function deviceCount (devices: Device[]): number {
  return devices.filter(d => !d.leftover).length
}

export type EventIcon = 'signIn' | 'signOut' | 'key' | 'shield' | 'userPlus' | 'userMinus' | 'mail' | 'lock' | 'alert' | 'link'

export interface EventLine {
  icon: EventIcon;
  text: string;
}

const s = (v: unknown) => (typeof v === 'string' ? v : '')

/** One line of the account's history, in words. */
export function eventLine (e: AccountEvent, printerName: (id: string) => string = id => id): EventLine {
  const d = e.detail ?? {}
  const printer = () => printerName(s(d.printer_id))
  switch (e.kind) {
    case 'sign_in': return { icon: 'signIn', text: d.method === 'passkey' ? 'Signed in with a passkey' : 'Signed in' }
    case 'sign_out': return { icon: 'signOut', text: 'Signed out' }
    case 'signed_out_everywhere': return { icon: 'signOut', text: 'Signed out everywhere' }
    case 'device_signed_out': return { icon: 'signOut', text: 'Signed a device out' }
    case 'passkey_added': return { icon: 'key', text: `Passkey added: ${s(d.name) || 'a passkey'}` }
    case 'passkey_removed': return { icon: 'key', text: `Passkey removed: ${s(d.name) || 'a passkey'}` }
    case 'passkey_renamed': return { icon: 'key', text: `Passkey renamed: ${s(d.name) || 'a passkey'}` }
    case 'password_changed': return { icon: 'lock', text: 'Password changed' }
    case 'password_reset': return { icon: 'lock', text: 'Password reset from an email link' }
    case 'two_step_on': return { icon: 'shield', text: 'Two-step sign-in turned on' }
    case 'two_step_off': return { icon: 'shield', text: 'Two-step sign-in turned off' }
    case 'recovery_code_used': return { icon: 'shield', text: `A recovery code was used${typeof d.left === 'number' ? `; ${d.left} left` : ''}` }
    case 'recovery_codes_renewed': return { icon: 'shield', text: 'New recovery codes made' }
    case 'email_change_requested': return { icon: 'mail', text: `Asked to change the email address to ${s(d.to)}` }
    case 'identity_linked': return { icon: 'link', text: `${providerName(s(d.provider))} linked` }
    case 'identity_unlinked': return { icon: 'link', text: `${providerName(s(d.provider))} unlinked` }
    case 'printer_shared': return { icon: 'userPlus', text: `You let ${s(d.email)} use ${printer()}${d.role ? `, as ${d.role === 'viewer' ? 'a Viewer' : 'an Operator'}` : ''}` }
    case 'printer_invited': return { icon: 'userPlus', text: `You invited ${s(d.email)} to use ${printer()}` }
    case 'invite_accepted': return { icon: 'userPlus', text: `${s(d.email)} accepted your invite to ${printer()}` }
    case 'printer_unshared': return { icon: 'userMinus', text: `${s(d.email)} can no longer use ${printer()}` }
    case 'share_ended': return { icon: 'userMinus', text: `${s(d.email)}'s access to ${printer()} ended` }
    case 'join_requested': return { icon: 'userPlus', text: `${s(d.email)} asked to use ${printer()}` }
    case 'joined_by_link': return { icon: 'userPlus', text: `${s(d.email)} joined ${printer()} with an invite link` }
    case 'invite_link_created': return { icon: 'link', text: `Invite link made for ${printer()}` }
    case 'invite_link_revoked': return { icon: 'link', text: `Invite link for ${printer()} turned off` }
    case 'app_disconnected': {
      const n = typeof d.sessions === 'number' ? d.sessions : 0
      return { icon: 'link', text: n ? `Disconnected a connected app and ended its ${n === 1 ? 'sign-in' : `${n} sign-ins`}` : 'Disconnected a connected app' }
    }
    case 'refresh_token_reused': return { icon: 'alert', text: 'A sign-in was used twice, so it was ended' }
    case 'deletion_requested': return { icon: 'alert', text: 'Deletion of the account asked for' }
    case 'deletion_cancelled': return { icon: 'alert', text: 'Deletion of the account cancelled' }
    default: return { icon: 'alert', text: e.kind.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()) }
  }
}

/** The Account area's sections, in the list's order. */
export type AccountSectionId =
  'overview' | 'profile' | 'security' | 'sessions' | 'printers' | 'tokens' | 'apps' | 'notifications' | 'library' | 'plan' | 'privacy' | 'delete'

export interface AccountSection {
  id: AccountSectionId;
  label: string;
  icon: string;
  /** In the list only once its page exists. */
  built: boolean;
}

export const ACCOUNT_SECTIONS: AccountSection[] = [
  { id: 'overview', label: 'Overview', icon: 'user', built: true },
  { id: 'profile', label: 'Profile', icon: 'idCard', built: true },
  { id: 'security', label: 'Sign-in and security', icon: 'shield', built: true },
  { id: 'sessions', label: 'Devices and sessions', icon: 'devices', built: true },
  { id: 'printers', label: 'Printers and access', icon: 'printer', built: true },
  { id: 'tokens', label: 'Access tokens', icon: 'key', built: true },
  { id: 'apps', label: 'Connected apps', icon: 'link', built: true },
  { id: 'notifications', label: 'Notifications', icon: 'bell', built: true },
  { id: 'library', label: 'Library and storage', icon: 'library', built: true },
  { id: 'plan', label: 'Plan', icon: 'card', built: true },
  { id: 'privacy', label: 'Privacy and data', icon: 'eye', built: true },
  { id: 'delete', label: 'Delete account', icon: 'trash', built: true }
]

/** The sections the list shows. */
export function accountSections (): AccountSection[] {
  return ACCOUNT_SECTIONS.filter(section => section.built)
}

/** The section an address names, or the overview. */
export function accountSectionFor (id: string | undefined | null): AccountSection {
  return accountSections().find(section => section.id === id) ?? ACCOUNT_SECTIONS[0]
}
