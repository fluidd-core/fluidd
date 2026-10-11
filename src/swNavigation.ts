/**
 * The navigations the service worker (sw.ts) must not answer with Fluidd's
 * index.html: they belong to the server, not to Fluidd.
 */
export const NAVIGATION_DENYLIST: RegExp[] = [
  /\/websocket/,
  /\/(printer|api|access|machine|server)\//,
  /\/webcam[2-4]?\//,
  // The console's own pages (WEB-12), which a browser must reach rather
  // than be given index.html: the central login's /authorize, /handoff
  // and /logout, an invite link's /j/<code>, and Fluidd's front-channel
  // logout page, which the console frames with ?iss= (so it misses the
  // precache).
  /^\/(?:authorize|handoff|logout)(?:[/?]|$)/,
  /^\/j\//,
  /^\/auth\//,
  // The Muon3D Slicer the printer serves beside Fluidd (/slicer/, and the
  // /slicer redirect to it): its own pages, which /slice frames. Workbox
  // matches the path with its query, so /slicer?x is the slicer's too.
  /^\/slicer(?:[/?]|$)/,
  // Files the printer or the console serve beside Fluidd, which a browser can
  // open directly: the licence texts, the M1 model and three.js, the Iroh
  // client, and the app association files.
  /^\/(?:licences|muon-3d|muon-link-web|\.well-known)\//,
  /^\/apple-app-site-association$/
]

/** Whether the service worker leaves a navigation to `pathname` to the network. */
export const isDeniedNavigation = (pathname: string): boolean =>
  NAVIGATION_DENYLIST.some(pattern => pattern.test(pathname))
