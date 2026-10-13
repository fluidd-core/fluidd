// Fluidd's front-channel logout (WEB-12); see logout.html.
//
// Forgets this browser's Muon3D session for the Fluidd the console serves:
// the access and refresh tokens, the printer it was showing, and the
// browser's Iroh key, as Fluidd's own sign-out does. Every open Fluidd tab
// hears the token go (the `storage` event) and signs out too.
//
// Only when the console asked: `iss` must be this page's own origin, which
// is the console that serves it, and the page must be framed by a page of
// that origin. Anything else does nothing. The console has two names
// (KAN-414) and names itself by one of them, so on either name `iss` may be
// either; the frame must still come from this page's own origin.
(function () {
  try {
    var consoles = ['https://control.muon3d.com', 'https://app.muon3d.com']
    var own = window.location.origin
    var iss = new URLSearchParams(window.location.search).get('iss')
    if (!iss) return
    iss = iss.replace(/\/$/, '')
    if (iss !== own && !(consoles.indexOf(iss) >= 0 && consoles.indexOf(own) >= 0)) return
    if (window.parent === window) return
    if (!document.referrer || new URL(document.referrer).origin !== window.location.origin) return
    ;['muon.cloud.token', 'muon.cloud.refresh', 'muon.cloud.active', 'muon.cloud.key'].forEach(function (key) {
      window.localStorage.removeItem(key)
    })
  } catch (e) {
    // No storage, or an unreadable address: nothing to forget.
  }
})()
