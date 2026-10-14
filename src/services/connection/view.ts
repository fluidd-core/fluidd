/** Where Fluidd stands with the printer it is on. */
export interface ConnectionFacts {
  socketConnected: boolean;
  apiConnected: boolean;
  authenticated: boolean;
  /** The socket client is trying. */
  socketConnecting: boolean;
  /** Fluidd has been connected to this printer since it was chosen. */
  wasConnected: boolean;
  /** Connected, but nothing has arrived for a few seconds. */
  stalled: boolean;
  /** A page that is not a printer's own (Printers, the account's, the console's). */
  printerIndependent: boolean;
  /** A page for a printer that is still opening (PrinterOpening says so). */
  otherPrinter: boolean;
  /**
   * The printer went quiet while installing an update (services/updates):
   * 'updating', or 'updating-late' past the time it said a restart takes.
   */
  updating?: 'updating' | 'updating-late' | null;
}

export interface ConnectionView {
  /** Show the page. */
  page: boolean;
  /** Its controls are out of date and must not send: the page is from before the connection dropped. */
  stale: boolean;
  /** A bar over the page: lost touch and trying again, or a quiet spell. */
  banner: 'reconnecting' | 'quiet' | null;
  /** A whole screen instead of the page: still connecting the first time, unable to, or restarting into an update. */
  screen: 'connecting' | 'unreachable' | 'updating' | 'updating-late' | null;
}

/**
 * What to show for the connection (the concept sheet's States board). A
 * drop after Fluidd has been connected keeps the page with its last view
 * under a bar that says it is trying again; the store keeps the printer's
 * last state through a drop (socket/onSocketClose resets only the
 * connection's modules). Only a printer never reached since it was chosen
 * gets a screen of its own.
 */
export function connectionView (f: ConnectionFacts): ConnectionView {
  if (f.printerIndependent || f.otherPrinter) return { page: true, stale: false, banner: null, screen: null }
  if (f.socketConnected && f.apiConnected) return { page: true, stale: false, banner: f.stalled ? 'quiet' : null, screen: null }
  // Moonraker answered and wants a login: the login page.
  if (!f.authenticated && f.apiConnected) return { page: true, stale: false, banner: null, screen: null }
  // Quiet because it is restarting into an update: say so, not "trying again" or "can't reach".
  if (f.updating) return { page: false, stale: false, banner: null, screen: f.updating }
  if (f.wasConnected) return { page: true, stale: true, banner: 'reconnecting', screen: null }
  return { page: false, stale: false, banner: null, screen: f.socketConnecting ? 'connecting' : 'unreachable' }
}

/** "4 s", "1 min 5 s": the wait before the next try. */
export function retryIn (ms: number): string {
  const s = Math.max(1, Math.ceil(ms / 1000))
  if (s < 60) return `${s} s`
  const m = Math.floor(s / 60)
  const rest = s % 60
  return rest ? `${m} min ${rest} s` : `${m} min`
}
