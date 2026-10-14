/** How long after G the second key still counts, as in GitHub and Gmail. */
export const GO_KEY_WINDOW_MS = 1500

export type GoKeyStep = { kind: 'start' } | { kind: 'go', key: string } | null

/**
 * G then a letter goes to a page: G O Overview, G J Jobs, G P every printer.
 * `feed` takes each shortcut as keyboardEventToKeyboardShortcut spells it
 * and says whether it started a sequence, finished one, or is not one.
 */
export class GoKeys {
  private startedAt: number | null = null

  feed (shortcut: string, now: number): GoKeyStep {
    const started = this.startedAt
    this.startedAt = null
    if (started !== null && now - started <= GO_KEY_WINDOW_MS && /^[a-z]$/i.test(shortcut)) {
      return { kind: 'go', key: shortcut.toLowerCase() }
    }
    if (shortcut === 'g' || shortcut === 'G') {
      this.startedAt = now
      return { kind: 'start' }
    }
    return null
  }
}
