import Vue from 'vue'
import { cardLayout } from '@/services/overview/cards'

export const REMEMBER_CONTROL_FOLDS = true
export interface ControlPreferences { version: 1 | 2; folds: Record<string, boolean>; overview?: { cards: string[] | null } }
export interface PreferenceContext { accountId: string | null; printerId: string | null; token: string | null }
export interface PreferenceRemote {
  read: (context: PreferenceContext) => Promise<ControlPreferences>;
  patch: (context: PreferenceContext, folds: Record<string, boolean>) => Promise<ControlPreferences>;
  patchLayout?: (context: PreferenceContext, cards: string[] | null) => Promise<ControlPreferences>;
}

export class ControlPreferenceStore {
  state = Vue.observable({ folds: {} as Record<string, boolean>, layout: null as string[] | null, layoutError: '', error: '', ready: false })
  private context: PreferenceContext | null = null
  private generation = 0
  private readGeneration = 0
  private edited: Record<string, boolean> = {}
  private revisions: Record<string, number> = {}
  private revision = 0
  private queue: Promise<void> = Promise.resolve()
  private loading: Promise<void> | null = null
  private layoutEdit: { cards: string[] | null; revision: number } | null = null

  private remote: PreferenceRemote
  private storage: Pick<Storage, 'getItem' | 'setItem'>

  constructor (remote: PreferenceRemote, storage: Pick<Storage, 'getItem' | 'setItem'>) {
    this.remote = remote
    this.storage = storage
  }

  isSelected (context: PreferenceContext): boolean {
    return context.accountId === this.context?.accountId && context.printerId === this.context?.printerId
  }

  select (context: PreferenceContext): Promise<void> {
    if (!this.isSelected(context)) {
      const pendingLayout = context.accountId && context.accountId === this.context?.accountId && context.printerId === this.context?.printerId ? this.layoutEdit : null
      this.generation++
      this.readGeneration++
      this.context = { ...context }
      this.edited = {}
      this.revisions = {}
      this.state.folds = {}
      this.state.layout = pendingLayout?.cards ?? null
      this.state.layoutError = pendingLayout ? 'Your Overview is not saved. Try again with the refreshed session.' : ''
      this.layoutEdit = pendingLayout
      this.state.error = ''
      this.state.ready = false
      this.loading = null
      // Old requests keep their captured session; this context gets its own queue.
      this.queue = Promise.resolve()
    } else {
      // A refreshed token is new authority for future requests, not a new person's
      // preferences. Keep pending edits while rotating the captured credentials.
      if (context.token !== this.context?.token) {
        this.readGeneration++
        this.loading = null
      }
      this.context = { ...context }
    }
    return this.refresh()
  }

  refresh (): Promise<void> {
    if (this.loading) return this.loading
    const context = this.context
    const generation = this.generation
    const readGeneration = this.readGeneration
    const revision = this.revision
    if (!context?.printerId || !validKey(context.printerId, 128)) return Promise.resolve()
    const pending = (async () => {
      try {
        let answer: ControlPreferences = { version: 1, folds: {} }
        if (REMEMBER_CONTROL_FOLDS) {
          if (context.accountId) {
            if (!context.token) throw new Error('Sign in again to sync your choices.')
            answer = await this.remote.read(context)
          } else {
            const saved = this.storage.getItem(this.browserKey(context))
            if (saved) answer = JSON.parse(saved)
          }
        }
        validatePreferences(answer)
        if (generation !== this.generation || readGeneration !== this.readGeneration || revision !== this.revision) return
        if (REMEMBER_CONTROL_FOLDS && context.accountId && answer.version !== 2) this.state.layoutError = 'Overview sync needs the updated service. These layout choices are not saved.'
        else if (!this.layoutEdit) this.state.layoutError = ''
        this.state.folds = { ...answer.folds, ...this.edited }
        if (!this.layoutEdit) {
          const cards = !REMEMBER_CONTROL_FOLDS ? null : context.accountId ? answer.overview?.cards ?? null : JSON.parse(this.storage.getItem(this.layoutKey(context)) ?? 'null')
          validateLayout(cards)
          this.state.layout = cards
        }
        if (Object.keys(this.edited).length === 0) this.state.error = ''
        this.state.ready = true
      } catch {
        if (generation === this.generation && readGeneration === this.readGeneration && revision === this.revision) this.state.error = 'Your choices are not saved. Try again when the service or browser storage is available.'
      }
    })()
    this.loading = pending
    pending.finally(() => { if (this.loading === pending) this.loading = null })
    return pending
  }

  setFold (key: string, open: boolean): Promise<void> {
    if (!validKey(key, 64)) return Promise.resolve()
    const context = this.context
    const generation = this.generation
    if (!context?.printerId || !validKey(context.printerId, 128)) {
      Vue.set(this.state.folds, key, open)
      this.state.error = 'Your choices are not saved until this printer is identified.'
      return Promise.resolve()
    }
    this.edited[key] = open
    const revision = ++this.revision
    this.revisions[key] = revision
    Vue.set(this.state.folds, key, open)
    const save = async () => {
      if (generation !== this.generation || !REMEMBER_CONTROL_FOLDS) return
      try {
        if (context.accountId) {
          if (!context.token) throw new Error('Sign in again to sync your choices.')
          const answer = await this.remote.patch(context, { [key]: open })
          validatePreferences(answer)
          if (generation !== this.generation) return
          if (this.revisions[key] === revision) delete this.edited[key]
          this.state.folds = { ...answer.folds, ...this.edited }
        } else {
          const saved = this.storage.getItem(this.browserKey(context))
          const current: unknown = saved ? JSON.parse(saved) : { version: 1, folds: {} }
          validatePreferences(current)
          const next = { version: 1 as const, folds: { ...current.folds, [key]: open } }
          validatePreferences(next)
          this.storage.setItem(this.browserKey(context), JSON.stringify(next))
          if (this.revisions[key] === revision) delete this.edited[key]
          this.state.folds = { ...next.folds, ...this.edited }
        }
        if (generation === this.generation) {
          if (Object.keys(this.edited).length === 0) this.state.error = ''
          this.state.ready = true
        }
      } catch {
        if (generation === this.generation) this.state.error = 'Your choices are not saved. Try again when the service or browser storage is available.'
      }
    }
    this.queue = this.queue.then(save)
    return this.queue
  }

  private browserKey (context: PreferenceContext): string {
    return `muon.control.v1.anonymous.${context.printerId}`
  }

  private layoutKey (context: PreferenceContext): string { return `muon.overview.v2.anonymous.${context.printerId}` }

  setLayout (cards: string[] | null): Promise<void> {
    validateLayout(cards)
    cards = cards === null ? null : [...cards]
    this.state.layout = cards
    const context = this.context
    const generation = this.generation
    if (!context?.printerId || !validKey(context.printerId, 128)) {
      this.state.layoutError = 'These choices last for this visit until this printer is identified.'
      return Promise.resolve()
    }
    const edit = { cards, revision: ++this.revision }
    this.layoutEdit = edit
    this.queue = this.queue.then(async () => {
      if (generation !== this.generation || !REMEMBER_CONTROL_FOLDS) return
      try {
        if (context.accountId) {
          if (!context.token || !this.remote.patchLayout) throw new Error('Layout sync is unavailable.')
          const answer = await this.remote.patchLayout(context, edit.cards)
          validatePreferences(answer)
          if (answer.version !== 2) throw new Error('Layout sync is unavailable.')
          if (generation !== this.generation) return
          this.state.folds = { ...answer.folds, ...this.edited }
          if (this.layoutEdit === edit) this.state.layout = answer.overview?.cards ?? null
        } else {
          this.storage.setItem(this.layoutKey(context), JSON.stringify(edit.cards))
        }
        if (this.layoutEdit === edit) { this.layoutEdit = null; this.state.layoutError = '' }
      } catch {
        if (generation === this.generation) this.state.layoutError = 'Your Overview is not saved. Try again when layout sync or browser storage is available.'
      }
    })
    return this.queue
  }

  async retry (): Promise<void> {
    const generation = this.generation
    await this.refresh()
    if (generation !== this.generation) return
    await Promise.all(Object.entries(this.edited).map(([key, open]) => this.setFold(key, open)))
    if (this.layoutEdit) await this.setLayout(this.layoutEdit.cards)
  }
}

function validKey (key: string, limit: number): boolean {
  return key.length > 0 && key.length <= limit && /^[a-z0-9_.:-]+$/i.test(key)
}

export function validatePreferences (value: unknown): asserts value is ControlPreferences {
  const p = value as ControlPreferences | null
  if (!p || ![1, 2].includes(p.version) || !p.folds || typeof p.folds !== 'object' || Array.isArray(p.folds) ||
    Object.keys(p.folds).length > 64 || Object.entries(p.folds).some(([k, v]) => !validKey(k, 64) || typeof v !== 'boolean')) {
    throw new Error('Unsupported Control preferences.')
  }
  if (p.version === 2) {
    if (!p.overview) throw new Error('Unsupported Overview preferences.')
    validateLayout(p.overview.cards)
  }
}

export function validateLayout (cards: unknown): asserts cards is string[] | null {
  if (cards !== null && (!Array.isArray(cards) || cards.length > 12 || JSON.stringify(cardLayout(cards)) !== JSON.stringify(cards))) throw new Error('Unsupported Overview layout.')
}
