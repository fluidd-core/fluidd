/**
 * Fluidd's host of printer-bridge/1 for /slice: the slicer's embed.html in a
 * frame, hosted with @muon3d/printer-client's helper (vendored, Apache-2.0:
 * vendor/printer-client/bridge/host.ts), which keeps the host's rules.
 *
 * - The helper listens before the frame's src is set, and answers a hello
 *   only from the frame's window at the origin of that src.
 * - Every op names a printer key; one that is not Fluidd's selection now is
 *   refused with `printer-changed`. When Fluidd's printer changes, the frame
 *   is told (printer.changed) before anything else about the new printer, and
 *   what was running for the old one ends.
 * - The start is the host's: print.request opens Fluidd's own dialog
 *   (PrintConfirmDialog.vue), only for files this frame uploaded to that
 *   printer in the last 30 minutes; Print, Queue or Upload only.
 * - Uploads, reads, starts and queue entries go over Fluidd's own
 *   $httpClient (the printer on the network, or Iroh); status comes from
 *   Fluidd's own socket subscription; console lines from its
 *   notify_gcode_response handling.
 * - The account's Library (0.4.0, library.ts): given `library`, the welcome
 *   grants it. Its requests name no printer, so a switch never ends one.
 */
import type { Store } from 'vuex'
import {
  createBridgeHost,
  type BridgeHost,
  type ConfirmAnswer,
  type ConfirmRequest,
  type HostLibrary,
  type HostLogEntry
} from './vendor/printer-client/bridge/host'
import type { BridgePrinter, Density, HostLook, HostSetup, PrinterMaterial, Theme } from './vendor/printer-client/bridge/protocol'
import { createFluiddAdapter, type HttpClient } from './adapter'
import { bridgePrinterFor, createIdentityCache, samePrinter, type FluiddSelection } from './selection'
import { createStoreStatusFeed } from './statusFeed'

export interface SlicerHostOptions {
  frame: HTMLIFrameElement;
  /** The slicer's embed.html (slicerUrl.ts). */
  slicerUrl: URL;
  store: Pick<Store<any>, 'state' | 'getters' | 'subscribeAction'>;
  http: HttpClient;
  /** What Fluidd shows now (fluidd.ts). */
  selection: () => FluiddSelection;
  /** Whether Fluidd's requests travel over Iroh now (no upload progress there). */
  remote: () => boolean;
  /** Asks the network printer at an API address its /server/muon/identity, through Fluidd's own client. */
  fetchIdentity: (apiUrl: string) => Promise<unknown>;
  confirm: (request: ConfirmRequest) => Promise<ConfirmAnswer>;
  theme: Theme;
  density?: Density;
  /** Fluidd's look (ui.look, look.ts): the slicer draws itself as a part of the page. */
  look?: HostLook;
  /** What printer `key` has loaded, and the material table (printer.setup, setup.ts); null for any but the selected one. */
  setup?: (key: string) => HostSetup | null;
  /**
   * The slicer set what printer `key` has loaded (printer.material, 0.3.0):
   * the host keeps it as that printer's, as Overview and Control do. Given,
   * the welcome grants printer.material; the helper passes on only those for
   * the selected printer while it takes writes.
   */
  onMaterial?: (key: string, material: PrinterMaterial) => void;
  /** The account's Library (library.ts): given, the welcome grants `library` (0.4.0). */
  library?: HostLibrary;
  hostVersion: string;
  onState?: (state: Record<string, unknown>) => void;
  log?: (entry: HostLogEntry) => void;
  /** Where the hello arrives (the page's window). */
  target?: Pick<Window, 'addEventListener' | 'removeEventListener'>;
}

export interface SlicerHost {
  bridge: BridgeHost;
  /** Reads Fluidd's selection again and tells the frame when it changed. */
  refresh (): void;
  /** The printer the frame was last told of. */
  printer (): BridgePrinter | null;
  close (): void;
}

export function startSlicerHost (options: SlicerHostOptions): SlicerHost {
  const identity = createIdentityCache(options.fetchIdentity)
  let announced: BridgePrinter | null = null
  let bridge: BridgeHost | null = null
  let closed = false
  let connected = false
  let retry: ReturnType<typeof setTimeout> | null = null

  const now = (): BridgePrinter | null => {
    const selection = options.selection()
    // Fluidd's socket came back (a restart, a switch): an identity that failed is asked again at once.
    if (selection.connected && !connected) identity.forgetFailures()
    connected = selection.connected
    if (!selection.cloud && selection.apiUrl && !selection.switching && identity.due(selection.apiUrl)) {
      identity.ask(selection.apiUrl).then((answer) => {
        refresh()
        if (answer.answered || closed) return
        // Not answered: asked again once the failure has stood its time, even if nothing else changes.
        if (retry) clearTimeout(retry)
        retry = setTimeout(() => { retry = null; refresh() }, identity.retryIn(selection.apiUrl))
      }, () => {})
    }
    return bridgePrinterFor(selection, selection.apiUrl ? identity.get(selection.apiUrl) : undefined)
  }

  /** Tells the frame of a change first, then answers about the printer selected now. */
  const refresh = () => {
    if (closed) return
    const next = now()
    if (samePrinter(announced, next)) return
    announced = next
    bridge?.printerChanged()
  }

  const selected = (): BridgePrinter | null => {
    refresh()
    return announced
  }

  const adapter = createFluiddAdapter({
    http: options.http,
    selected,
    reportsProgress: () => !options.remote(),
    status: (key) => createStoreStatusFeed(options.store, () => selected()?.key === key),
    confirm: options.confirm
  })

  announced = now()
  bridge = createBridgeHost({
    frame: { window: () => options.frame.contentWindow, origin: options.slicerUrl.origin },
    target: options.target ?? window,
    host: 'fluidd',
    hostVersion: options.hostVersion,
    theme: options.theme,
    density: options.density,
    look: options.look,
    setup: options.setup,
    onMaterial: options.onMaterial,
    library: options.library,
    adapter,
    onState: options.onState,
    log: options.log
  })

  // Console lines of the selected printer, as Fluidd's console takes them in.
  const stopGcode = options.store.subscribeAction((action) => {
    if (action.type !== 'socket/notifyGcodeResponse' || typeof action.payload !== 'string') return
    const key = selected()?.key
    if (key) bridge?.gcode(key, [action.payload])
  })

  // The listener is in place: now the frame may load.
  options.frame.src = options.slicerUrl.href

  return {
    bridge,
    refresh,
    printer: () => announced,
    close () {
      if (closed) return
      closed = true
      if (retry) clearTimeout(retry)
      stopGcode()
      bridge?.close()
    }
  }
}
