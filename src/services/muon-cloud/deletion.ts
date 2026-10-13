import Vue from 'vue'

/** Shared by both console clients and the UI; never part of the printer's resettable store. */
export const deletionState = Vue.observable<{ deleteAfter: number | null }>({ deleteAfter: null })
let revision = 0

export const deletionRevision = (): number => revision

function publish (date: number | null, barrier = false): void {
  if (barrier || deletionState.deleteAfter !== date) revision++
  deletionState.deleteAfter = date
}

export const clearDeletion = (): void => publish(null, true)

function deletionDate (value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

/** Only callers holding the current stored session may publish an answer here. */
export function observeDeletion (method: string, path: string, status: number, body: Record<string, any>, startedAt = revision): void {
  // A response sent before keeping the account cannot put it back into suspension.
  if (startedAt !== revision) return
  if (status === 403 && body.deletion_pending === true) {
    const date = deletionDate(body.delete_after)
    if (date !== null) publish(date)
  } else if (status >= 200 && status < 300) {
    if (method === 'GET' && path === '/v1/me') {
      publish(deletionDate(body.account?.deletion?.delete_after))
    } else if (method === 'POST' && path === '/v1/me/deletion/cancel') {
      clearDeletion()
    }
  }
}

/** These views require the cloud account. Local printer pages and permitted account routes stay usable. */
export function deletionBlocksView (name: string | null | undefined): boolean {
  return !!name && (name.startsWith('Library') || name === 'Link a printer' || name === 'Join a printer')
}
