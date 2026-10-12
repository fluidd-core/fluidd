/**
 * The promise a person accepts by turning the Library on (MSV-3): the text
 * published at PROMISE_URL, word for word, as the phone app shows it
 * (muon3d-app packages/model-client/src/promise.ts). The consent names the
 * text's version, and the model service refuses any other version
 * (`409 promise_changed`), so this text can only change together with a new
 * version on the service and the page.
 */
export const PROMISE_VERSION = '2026-09-26'

export const PROMISE_TITLE = 'Keep your models in your account'

export const PROMISE_LINES: readonly string[] = [
  'Muon3D stores the models you add to the Library, so they appear on each phone where you sign in.',
  'We store each file, its name, and where it came from.',
  'You can delete a model at any time, and we delete it at once.',
  'If you turn this off, we delete your stored models after 30 days.',
  'Your printer does not need this, and your models stay on this phone either way.'
]

export const PROMISE_URL = 'https://muon3d.com/privacy/model-services'

/** The promise in one paragraph, as the slicer's card shows it. */
export const PROMISE_SUMMARY = `${PROMISE_TITLE}. ${PROMISE_LINES.join(' ')}`
