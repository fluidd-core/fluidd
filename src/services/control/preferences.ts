import Vue from 'vue'

export const REMEMBER_CONTROL_FOLDS = true
export interface ControlPreferences { version: 1; folds: Record<string, boolean> }
export interface PreferenceContext { accountId: string | null; printerId: string | null; token: string | null }
export interface PreferenceRemote {
  read: (context: PreferenceContext) => Promise<ControlPreferences>;
  patch: (context: PreferenceContext, folds: Record<string, boolean>) => Promise<ControlPreferences>;
}

export class ControlPreferenceStore {
  state = Vue.observable({ folds: {} as Record<string, boolean>, error: '', ready: false })
  private context: PreferenceContext | null = null
  private generation = 0
  private edited: Record<string, boolean> = {}
  private revisions: Record<string, number> = {}
  private revision = 0
  private queue: Promise<void> = Promise.resolve()
  private loading: Promise<void> | null = null

  private remote: PreferenceRemote
  private storage: Pick<Storage, 'getItem' | 'setItem'>

  constructor (remote: PreferenceRemote, storage: Pick<Storage, 'getItem' | 'setItem'>) {
    this.remote = remote
    this.storage = storage
  }

  isSelected (context: PreferenceContext): boolean {
    return JSON.stringify(context) === JSON.stringify(this.context)
  }

  select (context: PreferenceContext): Promise<void> {
    if (!this.isSelected(context)) {
      this.generation++
      this.context = { ...context }
      this.edited = {}
      this.revisions = {}
      this.state.folds = {}
      this.state.error = ''
      this.state.ready = false
      this.loading = null
      // Old requests keep their captured session; this context gets its own queue.
      this.queue = Promise.resolve()
    }
    return this.refresh()
  }

  refresh (): Promise<void> {
    if (this.loading) return this.loading
    const context = this.context
    const generation = this.generation
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
        if (generation !== this.generation || revision !== this.revision) return
        this.state.folds = { ...answer.folds, ...this.edited }
        this.state.error = ''
        this.state.ready = true
      } catch {
        if (generation === this.generation && revision === this.revision) this.state.error = 'Your choices are not saved. Try again when the service or browser storage is available.'
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
          this.storage.setItem(this.browserKey(context), JSON.stringify({ version: 1, folds: this.state.folds }))
        }
        if (generation === this.generation) {
          this.state.error = ''
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

  async retry (): Promise<void> {
    const generation = this.generation
    await this.refresh()
    if (generation !== this.generation) return
    for (const [key, open] of Object.entries(this.edited)) await this.setFold(key, open)
  }
}

function validKey (key: string, limit: number): boolean {
  return key.length > 0 && key.length <= limit && /^[a-z0-9_.:-]+$/i.test(key)
}

export function validatePreferences (value: unknown): asserts value is ControlPreferences {
  const p = value as ControlPreferences | null
  if (!p || p.version !== 1 || !p.folds || typeof p.folds !== 'object' || Array.isArray(p.folds) ||
    Object.keys(p.folds).length > 64 || Object.entries(p.folds).some(([k, v]) => !validKey(k, 64) || typeof v !== 'boolean')) {
    throw new Error('Unsupported Control preferences.')
  }
}
