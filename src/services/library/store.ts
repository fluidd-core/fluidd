/**
 * The Library as Fluidd shows it: whether it is on, what it holds, the
 * account's preferences and the storage used, kept for the account signed
 * in now.
 *
 * Kept outside Vuex, as the account is (muon-cloud/state.ts): Fluidd resets
 * its whole store every time it switches printer, and the Library belongs
 * to the account, not to a printer. A change of account starts it again.
 */
import Vue, { watch } from 'vue'
import { cloudState } from '@/services/muon-cloud/state'
import {
  createLibraryClient,
  describeLibraryError,
  LibraryError,
  notSignedIn,
  type LibraryClient,
  type LibraryInfo,
  type LibraryItem,
  type Preferences,
  type PreferencesPatch,
  type PrintedEvent,
  type Version
} from './api'
import { modelsAssertion } from './assertion'
import { syncFeed } from './feed'
import { libraryPromise } from './promise'
import { cleanName, saveToLibrary, type SaveProgress, type SaveRequest } from './save'

export interface LibraryState {
  /** The account the rest belongs to. */
  account: string | null;
  /** The service has answered for this account at least once. */
  checked: boolean;
  busy: boolean;
  enabled: boolean;
  promiseVersion: string | null;
  /** When the files of a Library turned off are deleted. */
  purgeAfter: string | null;
  usedBytes: number | null;
  quotaBytes: number | null;
  preferences: Preferences | null;
  items: Record<string, LibraryItem>;
  rev: number;
  /** The list has been read at least once. */
  synced: boolean;
  error: string | null;
  errorCode: string | null;
}

function blank (account: string | null): LibraryState {
  return {
    account,
    checked: false,
    busy: false,
    enabled: false,
    promiseVersion: null,
    purgeAfter: null,
    usedBytes: null,
    quotaBytes: null,
    preferences: null,
    items: {},
    rev: 0,
    synced: false,
    error: null,
    errorCode: null
  }
}

export const libraryState = Vue.observable<LibraryState>(blank(null))

let client: LibraryClient = createLibraryClient({ assertion: modelsAssertion })

export function libraryClient (): LibraryClient {
  return client
}

/** For the specs: a client over a fake service. */
export function setLibraryClient (next: LibraryClient) {
  client = next
}

/** Starts the Library again for `account` (null: signed out). */
export function resetLibrary (account: string | null) {
  Object.assign(libraryState, blank(account))
}

function setError (error: unknown) {
  libraryState.error = describeLibraryError(error)
  libraryState.errorCode = error instanceof LibraryError ? error.code : null
}

function clearItems () {
  libraryState.items = {}
  libraryState.rev = 0
  libraryState.synced = false
}

function takeInfo (info: LibraryInfo) {
  libraryState.enabled = info.enabled
  libraryState.promiseVersion = info.promise_version ?? null
  libraryState.purgeAfter = info.account?.purge_after ?? null
  libraryState.usedBytes = typeof info.used_bytes === 'number' ? info.used_bytes : null
  libraryState.quotaBytes = typeof info.quota_bytes === 'number' ? info.quota_bytes : null
}

const signedInAccount = (): string | null => cloudState.account?.id ?? null

let watching = false

/** Follows the account: signing in reads its Library, signing out forgets it. Once. */
export function watchLibraryAccount () {
  if (watching) return
  watching = true
  watch(signedInAccount, (account) => {
    if (account === libraryState.account) return
    resetLibrary(account)
    if (account) refreshLibrary().catch(() => {})
  }, { immediate: true })
}

let refreshing: Promise<void> | null = null

/** Reads whether the Library is on, the preferences and the storage, then the list when it is on. */
export function refreshLibrary (): Promise<void> {
  if (!refreshing) refreshing = readLibrary().finally(() => { refreshing = null })
  return refreshing
}

async function readLibrary () {
  const account = signedInAccount()
  if (account !== libraryState.account) resetLibrary(account)
  if (!account) return
  libraryState.busy = true
  try {
    // Preferences need no consent: "Never ask" works before anything was saved.
    const [info, preferences] = await Promise.all([
      client.info(),
      client.preferences().catch((error: unknown) => error instanceof LibraryError ? error : Promise.reject(error))
    ])
    if (libraryState.account !== account) return
    takeInfo(info)
    libraryState.checked = true
    libraryState.error = null
    libraryState.errorCode = null
    if (preferences instanceof LibraryError) setError(preferences)
    else libraryState.preferences = preferences
    if (info.enabled) await syncLibrary()
    else clearItems()
  } catch (error) {
    if (libraryState.account === account) setError(error)
  } finally {
    if (libraryState.account === account) libraryState.busy = false
  }
}

let syncing: Promise<void> | null = null

/** Brings the list up to date from the feed. */
export function syncLibrary (): Promise<void> {
  if (!syncing) syncing = readFeed().finally(() => { syncing = null })
  return syncing
}

async function readFeed () {
  const account = libraryState.account
  if (!account) return
  try {
    const next = await syncFeed({ items: libraryState.items, rev: libraryState.rev }, since => client.feed(since))
    if (libraryState.account !== account) return
    libraryState.items = next.items
    libraryState.rev = next.rev
    libraryState.synced = true
  } catch (error) {
    if (libraryState.account !== account) return
    if (error instanceof LibraryError && error.code === 'consent_required') {
      libraryState.enabled = false
      clearItems()
    }
    setError(error)
  }
}

function keep (item: LibraryItem | undefined) {
  if (!item?.id) return
  if (item.state === 'deleted') Vue.delete(libraryState.items, item.id)
  else Vue.set(libraryState.items, item.id, item)
}

/** Everything in the Library, newest change first: prints and the models the phone app keeps, never a tombstone. */
export function libraryItems (): LibraryItem[] {
  return Object.values(libraryState.items)
    .filter(item => item.state !== 'deleted')
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
}

/** The prints, newest change first: saved plates with versions, never a tombstone. */
export function libraryPrints (): LibraryItem[] {
  return Object.values(libraryState.items)
    .filter(item => item.state !== 'deleted' && item.versioned === true)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
}

export async function setLibraryPreferences (patch: PreferencesPatch): Promise<void> {
  const before = libraryState.preferences
  if (before) libraryState.preferences = { ...before, ...patch }
  try {
    libraryState.preferences = await client.setPreferences(patch)
  } catch (error) {
    libraryState.preferences = before
    throw error
  }
}

/** Turns the Library on with the promise this Fluidd shows (MSV-3). */
export async function turnLibraryOn (version: string): Promise<void> {
  try {
    requireCurrentPromise(version)
    await client.consent(version)
  } catch (error) {
    // Read the service's promise again, so Settings shows the words it wants
    // now (or says this Control is too old to show them) instead of a reload loop.
    if (error instanceof LibraryError && error.code === 'promise_changed') await refreshLibrary()
    throw error
  }
  // A read that began before the consent would answer "off".
  await refreshing?.catch(() => {})
  await refreshLibrary()
}

/** Turns it off: the service deletes the files after 30 days, unless it is turned on again. */
export async function turnLibraryOff (): Promise<void> {
  const answer = await client.withdraw()
  libraryState.enabled = false
  libraryState.purgeAfter = answer?.account?.purge_after ?? null
  clearItems()
}

export async function renamePrint (id: string, name: string): Promise<void> {
  keep(await client.rename(id, cleanName(name)))
  syncLibrary().catch(() => {})
}

export async function copyPrint (id: string, name: string): Promise<LibraryItem> {
  const { item } = await client.copy(id, cleanName(name))
  keep(item)
  syncLibrary().catch(() => {})
  return item
}

export async function deletePrint (id: string): Promise<void> {
  await client.remove(id)
  Vue.delete(libraryState.items, id)
  syncLibrary().catch(() => {})
}

/** Counts a print as printed on `printer_name`: the only printer detail the Library keeps. */
export async function recordPrinted (id: string, event: PrintedEvent): Promise<void> {
  const { item } = await client.printed(id, { ...event, printer_name: cleanName(event.printer_name, 'Printer').slice(0, 64) })
  keep(item)
}

/** One item, from the list when it is there, else asked for (an address opened before the list was read). */
export async function loadItem (id: string): Promise<LibraryItem | null> {
  const kept = libraryState.items[id]
  if (kept) return kept
  try {
    const item = await client.item(id)
    keep(item)
    return item
  } catch (error) {
    if (error instanceof LibraryError && error.code === 'not_found') return null
    throw error
  }
}

/** A print's versions, newest first. */
export async function printVersions (id: string): Promise<Version[]> {
  return (await client.versions(id)).versions
}

/** Makes an older version the print's current one again, as a new version (nothing is lost). */
export async function restoreVersion (id: string, version: number): Promise<void> {
  keep((await client.restore(id, version)).item)
  syncLibrary().catch(() => {})
}

/** A Library that needs the account: refuses at once when nobody is signed in. */
export function requireSignedIn () {
  if (!libraryState.account) throw notSignedIn()
}

/** Reads the Library once for this account, if nothing has yet. */
export async function ensureLibraryRead (): Promise<void> {
  if (libraryState.account && !libraryState.checked) await refreshLibrary()
}

/** One version's project (.3mf), for library.get: the print's current version when `version` is null. */
export async function loadProject (id: string, version: number | null): Promise<{ name: string, version: number, project: Uint8Array }> {
  const item = await client.item(id)
  let number = item.version ?? null
  let fileId = item.project_file_id ?? null
  if (version !== null && version !== number) {
    const found = (await client.versions(id)).versions.find(v => v.number === version)
    if (!found) throw new LibraryError('not_found', 'That version of the print is not in your Library.', 404)
    number = found.number
    fileId = found.files.find(f => f.role === 'project')?.id ?? null
  }
  if (number === null || !fileId) throw new LibraryError('not_found', 'That print has no project saved.', 404)
  const project = await client.get(await client.fileUrl(id, fileId))
  return { name: item.name, version: number, project }
}

/** Saves what the slicer sent (library.save), then reads the storage used again. */
export async function saveFromSlicer (request: SaveRequest, onProgress?: (progress: SaveProgress) => void) {
  if (request.consent) {
    await ensureLibraryRead()
    requireCurrentPromise(request.consent)
  }
  const saved = await saveToLibrary(client, request, onProgress)
  keep(saved.item)
  if (request.consent) libraryState.enabled = true
  refreshLibrary().catch(() => {})
  return saved
}

/** What the slicer is told of the Library (printer-client's LibraryStatus). */
export interface LibraryStatusView {
  signedIn: boolean;
  enabled: boolean;
  promise: { version: string, summary: string, url: string } | null;
  preferences: { autosave: boolean, ask: boolean } | null;
  usedBytes: number | null;
  quotaBytes: number | null;
}

export function libraryStatus (state: LibraryState = libraryState): LibraryStatusView {
  const signedIn = state.account !== null
  // The text here is the one this Fluidd can show; a service that now wants
  // another version gets no promise, so nobody consents to words they weren't shown.
  const promise = state.checked ? libraryPromise(state.promiseVersion) : null
  const promiseShown = signedIn && !state.enabled && promise !== null
  return {
    signedIn,
    enabled: signedIn && state.enabled,
    promise: promiseShown && promise ? { version: promise.version, summary: promise.summary, url: promise.url } : null,
    preferences: signedIn && state.preferences ? { autosave: state.preferences.autosave, ask: state.preferences.ask } : null,
    usedBytes: signedIn ? state.usedBytes : null,
    quotaBytes: signedIn ? state.quotaBytes : null
  }
}

function requireCurrentPromise (version: string) {
  if (!libraryState.account) throw notSignedIn()
  if (!libraryState.checked || !libraryPromise(version) || libraryState.promiseVersion !== version) {
    throw new LibraryError('promise_changed', "The Library's promise has changed. Reload to read the current promise.", 409)
  }
}
