/**
 * What the Account pages and the header's menu know about the account
 * (KAN-532), read from the console when a page asks and kept until the
 * person signs out. Outside Vuex, as the muon-cloud state is: Fluidd resets
 * its store on every printer switch, and the account stays.
 */
import Vue from 'vue'
import { cloudState } from '@/services/muon-cloud/state'
import { accountApi, type AccountEvent, type ConsoleConfig, type JoinApproval, type Me, type Session } from './api'
import { AccountError } from './client'

interface AccountState {
  /** The account these answers belong to; a different one empties them. */
  accountId: string | null;
  me: Me | null;
  sessions: Session[] | null;
  events: AccountEvent[] | null;
  approvals: JoinApproval[] | null;
  config: ConsoleConfig | null;
  /** What failed last, in words. */
  error: string;
}

export const accountState = Vue.observable<AccountState>({
  accountId: null,
  me: null,
  sessions: null,
  events: null,
  approvals: null,
  config: null,
  error: ''
})

/** Empties what was read for another account, or for none. */
function belongsTo (): boolean {
  const id = cloudState.account?.id ?? null
  if (accountState.accountId !== id) {
    accountState.accountId = id
    accountState.me = null
    accountState.sessions = null
    accountState.events = null
    accountState.approvals = null
    accountState.error = ''
  }
  return id !== null
}

export function describe (error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.'
}

async function read<K extends 'me' | 'sessions' | 'events' | 'approvals' | 'config'> (key: K, load: () => Promise<AccountState[K]>): Promise<AccountState[K]> {
  if (!belongsTo() && key !== 'config') return accountState[key]
  try {
    const value = await load()
    if (key === 'config' || accountState.accountId === (cloudState.account?.id ?? null)) accountState[key] = value
    return value
  } catch (error) {
    // A route the console doesn't have: empty, not an error.
    if (error instanceof AccountError && error.missing) return accountState[key]
    accountState.error = describe(error)
    throw error
  }
}

export const loadMe = () => read('me', () => accountApi.me())
export const loadSessions = () => read('sessions', async () => (await accountApi.sessions()).sessions)
export const loadEvents = () => read('events', async () => (await accountApi.events()).events)
export const loadApprovals = () => read('approvals', async () => (await accountApi.approvals()).approvals.filter(a => a.state === 'pending'))
export const loadConfig = () => read('config', () => accountApi.config())

/** Reads what the overview shows, each part on its own, so one failure leaves the rest. */
export function loadOverview (): Promise<void> {
  return Promise.allSettled([loadMe(), loadSessions(), loadEvents(), loadApprovals()]).then(() => undefined)
}

/** The name, changed: the console's answer, and the header's copy of it. */
export async function renameAccount (name: string): Promise<void> {
  const { account } = await accountApi.rename(name)
  if (accountState.me) accountState.me.account = { ...accountState.me.account, ...account }
  if (cloudState.account) cloudState.account = { ...cloudState.account, name: account.name }
}
