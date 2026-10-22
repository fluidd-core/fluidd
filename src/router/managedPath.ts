// The account console is part of the Fluidd shell now: sign-in is a dialog,
// linking is a dialog, and Fleet is an ordinary page. Only first-run setup
// hides the chrome: it runs in a phone's captive-portal window, before the
// printer is set up, and shows every error itself.
// The console's sign-in page (WEB-12) is the identity provider's own page,
// so it shows no printer chrome either, nor do signing out and the pages the
// console's emails open (KAN-532).
const MANAGED_CONSOLE_PATHS = new Set<string>([
  '/admin',
  '/setup',
  '/sign-in',
  '/sign-out',
  '/signed-out',
  '/account/verify-email',
  '/account/reset-password'
])

export function isManagedConsolePath (path: string): boolean {
  // Vue Router accepts a trailing slash on these routes. The shell must use
  // the same classification or it draws the printer watermark over sign-in.
  return MANAGED_CONSOLE_PATHS.has(path.replace(/\/+$/, '') || '/')
}
