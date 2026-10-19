// Generated from models docs/promise.md; run web/scripts/sync-profile-promise.mjs.
export const PROFILE_PROMISE_VERSION = '2026-10-13'
export const PROFILE_PROMISE: readonly string[] = [
  'Muon3D stores the models you add to the Library so they appear on each phone where you sign in.',
  'We store each file, its name and its source. You can delete a model at any time.',
  'If you turn Library storage off, we delete its stored models after 30 days.',
  'Your printer does not need this service, and your models stay on your phone either way.',
  'Your public profile is a separate choice. Your public name comes from the name you choose in Control.',
  'One setting in Control makes your name and handle public or private.',
  'When you choose a handle or edit a profile in Library, we store the handle, photo, text and links you supply.',
  'We remove photo metadata before storage. The public page and search indexing start off.',
  'If you turn the public page on, anyone can read those public fields.',
  'We never add your private identity name, email, printer names, EndpointIds, location or print history to that response.',
  'If you change a handle, we hold the previous handle for twelve months.',
  'It redirects only while your current page is public. You can change a handle once every 30 days.',
  'When you request account deletion, the console starts a 14-day grace period and tells this service to hide your profile.',
  'If you keep your account, the console tells this service to restore it.',
  'On final deletion, we remove the profile, photo and blocks and hold the handles for twelve months without the owner ID.',
  'A minimal hash of the deleted account ID prevents late notices from restoring deleted data.',
  'The existing Library retention windows remain: unfinished uploads and their files are removed after one day; item deletion records are removed after 30 days. The hourly job enforces these windows and expires handle holds.'
]
