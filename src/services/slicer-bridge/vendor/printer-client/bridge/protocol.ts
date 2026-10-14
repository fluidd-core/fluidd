// SPDX-License-Identifier: Apache-2.0
// Vendored from @muon3d/printer-client 0.2.0 (src/bridge/protocol.ts), Copyright 2026 Muon 3D
// Technologies Limited, under the Apache License 2.0 (vendor/printer-client/LICENSE and NOTICE). Changed for
// Fluidd by tools/vendor-printer-client.cjs: relative imports without ".ts"; Object.hasOwn as hasOwnProperty.call.
// printer-bridge/1: how a page that frames a printer client (the host: Fluidd, a reference host in the tests) and the
// client in the frame (the Muon3D Slicer) talk. This module holds the protocol's names, limits and message shapes, and
// the validators both sides run on everything they receive; client.ts and host.ts are the two sides.
//
// The handshake is two window messages. The client posts `hello` (with a fresh nonce) to its parent window, addressed
// to each origin it allows; the host answers once with `welcome`, which echoes the nonce and transfers a MessagePort.
// Everything after travels on that port, which only the two windows hold:
//
//   Request  { v: 1, id, op, params: { printer, … } }        client → host (`id` ≥ 1, unique per sender)
//   Result   { v: 1, re, printer, result }                  host → client, the answer to request `re`
//   Failure  { v: 1, re, printer, error: { kind, message, status?, action? } }
//   Progress { v: 1, re, printer, progress: UploadStep }    an upload's steps before its result
//   Event    { v: 1, event, printer, data }                 either way, unasked
//
// Every request, answer, progress message and event names its printer by key: a host refuses a request for a printer
// it has not selected (`printer-changed`), so a switch in the host between an upload and a start can never send the
// start to the other printer. Operations come in capabilities; the welcome lists the ones the host grants, a client
// never sends an operation outside them, a host answers an operation it does not know `unsupported`, and both ignore
// fields they do not know. Phases to come add capabilities inside version 1 (`muon.twin/1`, `muon.session/1`); a
// breaking change is version 2, chosen in the same hello.
//
// Nothing here trusts the other side. A validator returns the message it read or the reason it refused it; strings the
// other side sends are cut to their limits, and a printer's name is only ever display text.
//
// The conformance vectors (vectors/*.json) are the protocol's normative cases: where a prose description of an
// operation is shorter, they say what both sides do (print.request may also answer not-started or not-queued, and
// uploaded-only in either mode; queue.add answers {queued}; status.watch answers {status, eventtime};
// server.history.list takes an order, printer.get an optional printer). messages.json's answers are the results a
// client reads with parsePrintDecision and parseQueueAnswer.
//
// One dialog per send: a client asks print.request once with every path of a send. In start mode the host's dialog
// ("Print ‹file› on ‹printer›?") names the first and "and queue ‹n› more"; on Print it starts the first and approves
// the rest, once each, for queue.add, which then queues them with no second dialog (and only while the printer prints
// or is paused). In queue mode the dialog ("Queue ‹file› on ‹printer›?", "and ‹n› more", its button Queue, never
// Plate is clear) queues them all. Upload only, the dialog's ✕ and Esc answer uploaded-only in either mode: the files
// stay uploaded, and nothing is started or queued. The wording is the reference host's
// (e2e/fixtures/bridgeHost.html); a host's own may differ.
//
// The host's UI (inside version 1, optional on both sides): a host that wants the client drawn as a part of its own page
// grants `ui.look` (its resolved colours, radii and fonts; the client then draws no chrome of its own), `ui.mode` (its
// Simple or Pro switch) and `printer.setup` (what its selected printer has loaded, and its material table). A welcome
// may carry the first look and mode; the events `ui.look`, `ui.mode` and `printer.setup` carry each change. A client
// lists what it uses in its hello's `features`, so a host knows whether the frame will draw itself as a part of the
// host's page. An old client ignores the fields and the events; an old host never sends them, and the client then
// draws itself as it always has. A malformed look, mode or setup is dropped: never a reason to refuse a welcome.
import { CHECKSUM_RE } from '../multipart/build';
import { unsafeNameReason } from '../multipart/names';
import { cleanText, type ErrorKind, type PrinterError } from '../errors/kinds';
import { parseBridgeError } from '../errors/parse';

export const BRIDGE_PROTOCOL = 'printer-bridge';
/** The versions this package speaks. */
export const BRIDGE_VERSIONS: readonly number[] = [1];

/** The capabilities of version 1. */
export const CAPABILITIES_V1 = ['printer', 'status', 'gcode', 'moonraker.read', 'files.upload', 'print'] as const;

/** Each operation a client sends, and the capability it needs (null: every host answers it). */
export const OPS = {
  'printer.get': 'printer',
  'status.watch': 'status',
  'moonraker.read': 'moonraker.read',
  'files.upload': 'files.upload',
  'print.request': 'print',
  'queue.add': 'print',
  'print.cancel': 'print',
  cancel: null,
} as const;
export type BridgeOp = keyof typeof OPS;

/**
 * The host's UI capabilities (see the file comment), optional inside version 1: a host grants the ones it sends, and a
 * client lists the ones it uses in its hello's `features`.
 */
export const CAPABILITIES_HOST_UI = ['ui.look', 'ui.mode', 'printer.setup'] as const;
export type HostUiCapability = (typeof CAPABILITIES_HOST_UI)[number];

/** The events a host sends, and the capability each comes with (null: always). */
export const HOST_EVENTS = {
  'printer.changed': 'printer',
  'printer.status': 'status',
  'printer.gcode': 'gcode',
  'ui.theme': null,
  'ui.density': null,
  'ui.look': 'ui.look',
  'ui.mode': 'ui.mode',
  'printer.setup': 'printer.setup',
} as const;
export type HostEventName = keyof typeof HOST_EVENTS;

/** The events a client sends. */
export const CLIENT_EVENTS = ['slicer.state'] as const;
export type ClientEventName = (typeof CLIENT_EVENTS)[number];

/** The Moonraker reads a host allows through `moonraker.read` (version 1). Anything else is `not-allowed`. */
export const READ_METHODS = [
  'printer.objects.query',
  'printer.info',
  'server.info',
  'server.files.metadata',
  'server.gcode_store',
  'server.job_queue.status',
  'server.history.list',
] as const;
export type ReadMethod = (typeof READ_METHODS)[number];

/** The limits both sides hold the other to. */
export const LIMITS = {
  /** Paths in one print.request or queue.add. */
  paths: 16,
  /** An upload's bytes: 512 MiB. */
  uploadBytes: 512 * 1024 * 1024,
  /** How long an upload may wait for its print.request, and an approval for its queue.add: 30 minutes. */
  approvalMs: 30 * 60 * 1000,
  /** server.gcode_store's `count`. */
  gcodeStore: 100,
  /** server.history.list's `limit`. */
  history: 5,
  /** Status events a host sends per second, at most (it merges what changes in between). */
  statusPerSecond: 4,
  /** The client says hello this often until it is welcomed… */
  helloEveryMs: 500,
  /** …and gives up after this long (the app then runs with no printer). */
  helloForMs: 10_000,
  /** Objects in a status watch or an objects query, and fields per object. */
  objects: 64,
  fields: 64,
  /** The longest object or field name, request id, method string, host name or version. */
  name: 128,
  /** The longest display text a host sends (a printer's name, its model). */
  text: 64,
  /** Console lines in one printer.gcode event, and the longest line. */
  lines: 200,
  line: 2000,
  /** Capabilities in a welcome, and features in a hello. */
  capabilities: 32,
  /** A look's longest value (a colour, a length, a shadow, a font stack), and its fonts. */
  lookValue: 256,
  lookFonts: 16,
  /** A font's URL. */
  url: 512,
  /** Materials in a printer.setup's table. */
  materials: 32,
} as const;

/** A 32-digit hex nonce (16 random bytes). */
export const NONCE_RE = /^[0-9a-f]{32}$/;
/** A printer's key: its EndpointId (64 hex), or `origin:<origin>` for a serving printer that did not identify itself. */
export const PRINTER_KEY_RE = /^(?:[0-9a-f]{64}|origin:https?:\/\/[^\s/?#]{1,253})$/;

export const isPrinterKey = (value: unknown): value is string => typeof value === 'string' && PRINTER_KEY_RE.test(value);

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

export interface Hello {
  protocol: typeof BRIDGE_PROTOCOL;
  type: 'hello';
  versions: number[];
  app: string;
  appVersion: string;
  nonce: string;
  /** What the client uses of the host's optional capabilities (CAPABILITIES_HOST_UI); [] from an older client. */
  features?: string[];
}

export type Theme = 'light' | 'dark';
export type Density = 'compact' | 'touch';

/** The host's Simple or Pro switch: a display choice (how much the client shows), never a permission. */
export type UiMode = 'simple' | 'pro';

/**
 * The tokens of a host's look, each with the kind of value it takes. The names are the host's own CSS custom
 * properties without their `--m3d-` prefix (Fluidd's redesign), so a host reads each with getComputedStyle; the
 * client maps them onto its own.
 */
export const LOOK_TOKENS = {
  bg: 'color',
  surface: 'color',
  'surface-2': 'color',
  raised: 'color',
  inset: 'color',
  border: 'color',
  'border-strong': 'color',
  text: 'color',
  'text-muted': 'color',
  'text-subtle': 'color',
  hover: 'color',
  accent: 'color',
  'on-accent': 'color',
  'accent-soft': 'color',
  success: 'color',
  warning: 'color',
  danger: 'color',
  overlay: 'color',
  'shadow-float': 'shadow',
  'radius-sm': 'length',
  'radius-md': 'length',
  'font-sans': 'font',
  'font-title': 'font',
  'font-mono': 'font',
} as const;
export type LookToken = keyof typeof LOOK_TOKENS;

/**
 * A font the host's look uses, for a client to load: its family as the look's font stacks name it, and a URL of a
 * woff2 or woff file. A client loads only a URL on its own origin (a printer serves the host and the client together).
 */
export interface HostFont {
  family: string;
  url: string;
  /** "400", or a variable font's range "100 900". */
  weight?: string;
  style?: 'normal' | 'italic';
}

/**
 * The host's look: its theme and the resolved values of its tokens (plain colours, lengths and font stacks, never a
 * reference to another token), and the fonts to load. A token the host leaves out keeps the client's own.
 */
export interface HostLook {
  theme: Theme;
  tokens: Partial<Record<LookToken, string>>;
  fonts?: HostFont[];
}

/**
 * Where the host's material came from: the spool its spool manager has active; the material the printer was told is
 * loaded (`loaded`: Muon's Fluidd keeps it in Klipper's save_variables, `muon_material`); the material the heaters are
 * set to; or an entry of its table (the `materials` list).
 */
export type MaterialSource = 'spool' | 'loaded' | 'heaters' | 'table';

/** A material as the host knows it. Strings are display text from the host. */
export interface HostMaterial {
  /** Its name as the host shows it ("PLA", "Teal PLA"). */
  name: string;
  /** Its filament type ("PLA", "PETG") when the host knows it; else null (a client may read it from the name). */
  type: string | null;
  /** "#RRGGBB", or null. */
  colour: string | null;
  /** Nozzle and bed temperatures, °C; null where the host has none. */
  nozzle: number | null;
  bed: number | null;
  source: MaterialSource;
  /** Grams left on a spool, when the spool manager says. */
  remaining?: number | null;
}

/**
 * printer.setup's data, for the printer the event names: what it has loaded now (null: the host cannot tell) and the
 * host's material table, as the host offers it.
 */
export interface HostSetup {
  material: HostMaterial | null;
  materials: HostMaterial[];
}

export interface Welcome {
  protocol: typeof BRIDGE_PROTOCOL;
  type: 'welcome';
  version: number;
  nonce: string;
  host: string;
  hostVersion: string;
  capabilities: string[];
  theme: Theme;
  density?: Density;
  /** The host's look, when it granted ui.look (else the client ignores one). */
  look?: HostLook;
  /** The host's Simple or Pro, when it granted ui.mode. */
  mode?: UiMode;
}

export type PrinterRoute = 'cloud' | 'local';
export type BridgeRole = 'owner' | 'operator' | 'viewer';

/** The host's selected printer, as the host describes it. Strings are display text from the host. */
export interface BridgePrinter {
  key: string;
  name: string;
  model: string | null;
  route: PrinterRoute;
  role: BridgeRole | null;
  online: boolean;
  shared?: boolean;
}

/** Klipper's objects and the fields of each to read (null: all of them). */
export type BridgeObjects = Record<string, string[] | null>;

/** An upload's steps: the body going out (`sent` null where the host cannot count), then the printer's checks. */
export type UploadStep = { step: 'sending'; sent: number | null; total: number } | { step: 'checking' };

export interface BridgeError {
  kind: ErrorKind;
  message: string;
  status?: number;
  action?: string;
}

export interface BridgeRequest {
  v: 1;
  id: number;
  op: string;
  params: Record<string, unknown>;
}
export interface BridgeResult {
  v: 1;
  re: number;
  printer: string | null;
  result: unknown;
}
export interface BridgeFailure {
  v: 1;
  re: number;
  printer: string | null;
  error: BridgeError;
}
export interface BridgeProgress {
  v: 1;
  re: number;
  printer: string;
  progress: UploadStep;
}
export interface BridgeEvent {
  v: 1;
  event: string;
  printer: string | null;
  data: unknown;
}

// ---- each operation's parameters and result, as validated --------------------------------------------------------

export type PrintMode = 'start' | 'queue';
/** Whether the host's dialog asks "Plate is clear" before a start: a client in a frame has no sheet to ask it in. */
export type PlateClearAsk = 'ask' | 'not-needed';

export type ReadParams =
  | { method: 'printer.objects.query'; params: { objects: BridgeObjects } }
  | { method: 'printer.info' | 'server.info' | 'server.job_queue.status'; params: Record<string, never> }
  | { method: 'server.files.metadata'; params: { filename: string } }
  | { method: 'server.gcode_store'; params: { count: number } }
  | { method: 'server.history.list'; params: { limit: number; order: 'asc' | 'desc' } };

export type OpRequest =
  | { op: 'printer.get'; printer: string | null }
  | { op: 'status.watch'; printer: string; objects: BridgeObjects }
  | ({ op: 'moonraker.read'; printer: string } & ReadParams)
  | { op: 'files.upload'; printer: string; name: string; size: number; checksum: string; bytes: ArrayBuffer }
  | { op: 'print.request'; printer: string; paths: string[]; mode: PrintMode; plateClear: PlateClearAsk }
  | { op: 'queue.add'; printer: string; paths: string[] }
  | { op: 'print.cancel'; printer: string; path: string }
  | { op: 'cancel'; printer: string; id: number };

/**
 * What a print.request did. `started` (with `startedPath`): the host's dialog said Print and the printer accepted the
 * start of the first path; the others wait, approved, for queue.add. `queued`: every path is queued. `uploaded-only`:
 * the person chose Upload only or closed the dialog (✕, Esc), in either mode: the files stay uploaded. `not-started` /
 * `not-queued`: the host's fresh read before it acted found the printer in a state that does not allow it (busy for a
 * start, idle for a queue), so nothing was sent. A start answers started, uploaded-only or not-started; a queue
 * request queued, uploaded-only or not-queued.
 */
export type PrintDecision =
  | { decision: 'started'; startedPath: string }
  | { decision: 'queued' | 'uploaded-only' | 'not-started' | 'not-queued' };

/** The decisions each mode of print.request may answer. */
export const PRINT_DECISIONS: Readonly<Record<PrintMode, readonly PrintDecision['decision'][]>> = {
  start: ['started', 'uploaded-only', 'not-started'],
  queue: ['queued', 'uploaded-only', 'not-queued'],
};

/**
 * What a queue.add did: `queued` true, every path is queued; false, the host's fresh read found the printer neither
 * printing nor paused, so nothing was sent (a queue entry there would heat its bed). queue.add shows no dialog: its
 * paths were approved by the print.request that started the first plate.
 */
export interface QueueAnswer {
  queued: boolean;
}

// ---------------------------------------------------------------------------
// Small readers
// ---------------------------------------------------------------------------

const record = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof ArrayBuffer) ? (value as Record<string, unknown>) : null;

const shortString = (value: unknown, max: number = LIMITS.name): value is string => typeof value === 'string' && value.length > 0 && value.length <= max;

const isInt = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;

/** A request or answer id: a positive safe integer. */
export const isId = (value: unknown): value is number => isInt(value, 1, Number.MAX_SAFE_INTEGER);

/** Display text from the other side: cleaned, cut to `max` characters. */
export const displayText = (value: unknown, max: number = LIMITS.text): string => (typeof value === 'string' ? cleanText(value, max) : '');

/** The error a validator gives. */
const bad = (message: string): BridgeError => ({ kind: 'bad-request', message });

/** A file's name as an operation names it: the safe-name rule, else the reason. */
function pathProblem(value: unknown): string | null {
  if (typeof value !== 'string') return 'a path must be a string';
  const reason = unsafeNameReason(value);
  return reason ? `"${value.slice(0, 64)}": ${reason}` : null;
}

/** A list of 1–16 distinct safe paths, or the reason it is not one. */
function readPaths(value: unknown): string[] | string {
  if (!Array.isArray(value) || value.length < 1 || value.length > LIMITS.paths) return `paths must be a list of 1 to ${LIMITS.paths} names`;
  for (const p of value) {
    const problem = pathProblem(p);
    if (problem) return problem;
  }
  if (new Set(value).size !== value.length) return 'paths must not repeat';
  return value as string[];
}

/** Objects to watch or query, or the reason they are refused. */
export function readObjects(value: unknown): BridgeObjects | string {
  const r = record(value);
  if (!r) return 'objects must be an object';
  const entries = Object.entries(r);
  if (entries.length < 1 || entries.length > LIMITS.objects) return `objects must name 1 to ${LIMITS.objects} objects`;
  const out: BridgeObjects = {};
  for (const [name, fields] of entries) {
    if (!shortString(name) || /[\u0000-\u001f\u007f&=?#]/.test(name)) return 'an object name is not one';
    if (fields === null) out[name] = null;
    else if (Array.isArray(fields) && fields.length <= LIMITS.fields && fields.every((f) => shortString(f) && !/[\u0000-\u001f\u007f&=?#,]/.test(f))) out[name] = [...fields];
    else return `the fields of "${name.slice(0, 64)}" must be null or a list of names`;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Origins
// ---------------------------------------------------------------------------

/**
 * The allowed origins, checked: each must be an exact http(s) origin, as `new URL(x).origin` writes it (no path, no
 * trailing slash). '*' is refused: any page could then drive the client. Returns them; throws on the first that is not
 * one.
 */
export function checkHostOrigins(origins: readonly string[]): string[] {
  return origins.map((origin) => {
    if (origin === '*') throw new Error("hostOrigins cannot be '*': list the exact origins of the pages that host the app.");
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error(`hostOrigins: "${origin}" is not an origin (such as https://app.muon3d.com).`);
    }
    if ((parsed.protocol !== 'https:' && parsed.protocol !== 'http:') || parsed.origin !== origin) {
      throw new Error(`hostOrigins: "${origin}" is not an exact origin; use "${parsed.origin}".`);
    }
    return origin;
  });
}

/** Whether a message's origin is one of the allowed ones (exact; the opaque origin 'null' never is). */
export function originAllowed(origin: string, allowed: readonly string[]): boolean {
  return origin !== 'null' && allowed.includes(origin);
}

// ---------------------------------------------------------------------------
// The handshake
// ---------------------------------------------------------------------------

/** 16 random bytes as hex (the hello's nonce). */
export function makeNonce(random: (bytes: Uint8Array) => Uint8Array = (b) => crypto.getRandomValues(b)): string {
  return [...random(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function helloMessage(opts: { app: string; appVersion: string; nonce: string; versions?: readonly number[]; features?: readonly string[] }): Hello {
  const hello: Hello = { protocol: BRIDGE_PROTOCOL, type: 'hello', versions: [...(opts.versions ?? BRIDGE_VERSIONS)], app: opts.app, appVersion: opts.appVersion, nonce: opts.nonce };
  // Only a client that uses one says so: an older host reads the hello as it always has.
  if (opts.features?.length) hello.features = readFeatures(opts.features);
  return hello;
}

/** A hello's features: the names it lists (short strings, at most LIMITS.capabilities, no repeats); [] for anything else. */
export function readFeatures(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((f): f is string => shortString(f)))].slice(0, LIMITS.capabilities);
}

/** A hello as a host reads it; null when the message is not one (it is then ignored, never answered). */
export function parseHello(data: unknown): Hello | null {
  const r = record(data);
  if (!r || r.protocol !== BRIDGE_PROTOCOL || r.type !== 'hello') return null;
  if (!Array.isArray(r.versions) || r.versions.length < 1 || r.versions.length > 8 || !r.versions.every((n) => isInt(n, 1, 1000))) return null;
  if (typeof r.nonce !== 'string' || !NONCE_RE.test(r.nonce)) return null;
  return {
    protocol: BRIDGE_PROTOCOL,
    type: 'hello',
    versions: [...(r.versions as number[])],
    app: displayText(r.app),
    appVersion: displayText(r.appVersion),
    nonce: r.nonce,
    // An older client's hello has none; a list that is not one reads as none, and the hello still counts.
    features: readFeatures(r.features),
  };
}

/** The highest version both sides speak, or null. */
export function commonVersion(offered: readonly number[], spoken: readonly number[] = BRIDGE_VERSIONS): number | null {
  const both = offered.filter((v) => spoken.includes(v));
  return both.length ? Math.max(...both) : null;
}

/**
 * A welcome as the client reads it, against the hello it sent: the protocol, the echoed nonce, a version it offered,
 * the host's name and version, the capabilities and the theme. Returns the welcome, or why it is refused (a string).
 * The window checks (the sender is the parent, its origin is allowed, exactly one port) are the caller's, on the event.
 * The look and the mode are read only where the welcome grants ui.look and ui.mode; a malformed one is left out.
 */
export function parseWelcome(data: unknown, hello: Pick<Hello, 'nonce' | 'versions'>): Welcome | string {
  const r = record(data);
  if (!r || r.protocol !== BRIDGE_PROTOCOL || r.type !== 'welcome') return 'not a welcome';
  if (r.nonce !== hello.nonce) return "the nonce is not the hello's";
  if (!isInt(r.version, 1, 1000) || !hello.versions.includes(r.version)) return 'a version the hello did not offer';
  if (!Array.isArray(r.capabilities) || r.capabilities.length > LIMITS.capabilities || !r.capabilities.every((c) => shortString(c))) return 'capabilities must be a list of names';
  if (r.theme !== 'light' && r.theme !== 'dark') return "theme must be 'light' or 'dark'";
  if (r.density !== undefined && r.density !== 'compact' && r.density !== 'touch') return "density must be 'compact' or 'touch'";
  const welcome: Welcome = {
    protocol: BRIDGE_PROTOCOL,
    type: 'welcome',
    version: r.version,
    nonce: r.nonce,
    host: displayText(r.host) || 'host',
    hostVersion: displayText(r.hostVersion),
    capabilities: [...new Set(r.capabilities as string[])],
    theme: r.theme,
  };
  if (r.density !== undefined) welcome.density = r.density;
  if (welcome.capabilities.includes('ui.look')) {
    const look = parseLook(r.look);
    if (look) welcome.look = look;
  }
  if (welcome.capabilities.includes('ui.mode')) {
    const mode = parseUiMode(r.mode);
    if (mode) welcome.mode = mode;
  }
  return welcome;
}

// ---------------------------------------------------------------------------
// Printers
// ---------------------------------------------------------------------------

/** A printer as the host describes it; null when it is not one (a client then takes it as no printer). */
export function parseBridgePrinter(value: unknown): BridgePrinter | null {
  const r = record(value);
  if (!r || !isPrinterKey(r.key)) return null;
  if (r.route !== 'cloud' && r.route !== 'local') return null;
  if (r.role !== null && r.role !== 'owner' && r.role !== 'operator' && r.role !== 'viewer') return null;
  if (typeof r.online !== 'boolean') return null;
  const name = displayText(r.name);
  if (!name) return null;
  const model = r.model === null || r.model === undefined ? null : displayText(r.model) || null;
  const printer: BridgePrinter = { key: r.key, name, model, route: r.route, role: r.role, online: r.online };
  if (r.shared === true) printer.shared = true;
  return printer;
}

// ---------------------------------------------------------------------------
// The host's UI: its look, its mode, its printer's setup
// ---------------------------------------------------------------------------

const NUMBER = String.raw`[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?`;
const CHANNEL = String.raw`(?:${NUMBER}(?:%|deg|turn|rad|grad)?|none)`;
const HEX_RE = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const COLOR_FUNCTION_RE = new RegExp(String.raw`^(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(\s*${CHANNEL}(?:\s*[,/]?\s*${CHANNEL}){2,3}\s*\)$`, 'i');
const COLOR_SPACE_RE = new RegExp(
  String.raw`^color\(\s*(?:srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020|xyz|xyz-d50|xyz-d65)(?:\s+(?:${NUMBER}%?|none)){3}(?:\s*/\s*(?:${NUMBER}%?|none))?\s*\)$`,
  'i',
);
const LENGTH_RE = new RegExp(String.raw`^(?:0|(${NUMBER})(px|rem|em))$`, 'i');
const SHADOW_LENGTH_RE = new RegExp(String.raw`^(?:0|[+-]?(?:\d+\.?\d*|\.\d+)px)$`, 'i');
const FONT_STACK_RE = /^[A-Za-z0-9 ,'"._-]+$/;
const FONT_FAMILY_RE = /^[A-Za-z0-9 ._-]{1,64}$/;

/**
 * A colour as a host's computed style writes it: hex, rgb() and hsl() (with or without alpha), hwb(), the lab and lch
 * families, color() in a named space, or `transparent`. Nothing that refers to another value (var(), url(),
 * currentcolor) and no nested function.
 */
export function isLookColor(value: string): boolean {
  return value.toLowerCase() === 'transparent' || HEX_RE.test(value) || COLOR_FUNCTION_RE.test(value) || COLOR_SPACE_RE.test(value);
}

/** A radius: 0, up to 64px, or up to 4rem or 4em. */
export function isLookLength(value: string): boolean {
  const m = LENGTH_RE.exec(value);
  if (!m) return false;
  if (m[1] === undefined) return true;
  const n = Number(m[1]);
  return n >= 0 && n <= (m[2].toLowerCase() === 'px' ? 64 : 4);
}

/** A font stack: family names (quoted or not) and generic families, separated by commas, with balanced quotes. */
export function isLookFont(value: string): boolean {
  if (!FONT_STACK_RE.test(value)) return false;
  return (value.match(/'/g)?.length ?? 0) % 2 === 0 && (value.match(/"/g)?.length ?? 0) % 2 === 0;
}

/** `text` split where `separator` matches outside parentheses; null when the parentheses do not balance. */
function splitTopLevel(text: string, separator: RegExp): string[] | null {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '(') depth++;
    else if (c === ')') {
      if (--depth < 0) return null;
    } else if (depth === 0 && separator.test(c)) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  if (depth !== 0) return null;
  parts.push(text.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
}

/** A box shadow: `none`, or up to 4 shadows, each `inset`, 2 to 4 lengths in px and at most one colour (isLookColor). */
export function isLookShadow(value: string): boolean {
  if (value.toLowerCase() === 'none') return true;
  const shadows = splitTopLevel(value, /,/);
  if (!shadows || shadows.length < 1 || shadows.length > 4) return false;
  return shadows.every((shadow) => {
    const parts = splitTopLevel(shadow, /\s/);
    if (!parts) return false;
    let lengths = 0;
    let colours = 0;
    let inset = 0;
    for (const part of parts) {
      if (part.toLowerCase() === 'inset') inset++;
      else if (SHADOW_LENGTH_RE.test(part)) lengths++;
      else if (isLookColor(part)) colours++;
      else return false;
    }
    return lengths >= 2 && lengths <= 4 && colours <= 1 && inset <= 1;
  });
}

const LOOK_VALUE: Record<(typeof LOOK_TOKENS)[LookToken], (value: string) => boolean> = {
  color: isLookColor,
  length: isLookLength,
  shadow: isLookShadow,
  font: isLookFont,
};

/** A font of a look, or null: a family name, and a woff2 or woff URL with nothing a CSS url() would need escaped. */
function readFont(value: unknown): HostFont | null {
  const r = record(value);
  if (!r || typeof r.family !== 'string' || !FONT_FAMILY_RE.test(r.family.trim())) return null;
  if (typeof r.url !== 'string' || r.url.length > LIMITS.url || !/^[^\s'"()\\]+$/.test(r.url)) return null;
  if (!/\.woff2?(?:[?#]|$)/i.test(r.url)) return null;
  const font: HostFont = { family: r.family.trim(), url: r.url };
  if (r.weight !== undefined) {
    if (typeof r.weight !== 'string' || !/^\d{1,3}(?: \d{1,3})?$/.test(r.weight)) return null;
    font.weight = r.weight;
  }
  if (r.style !== undefined) {
    if (r.style !== 'normal' && r.style !== 'italic') return null;
    font.style = r.style;
  }
  return font;
}

/**
 * A host's look (the welcome's `look`, a ui.look event's data), or null when it is not one: a theme and an object of
 * tokens. Each token is checked against its kind (LOOK_TOKENS); one that fails, or that this version does not know, is
 * left out, and the client keeps its own value for it. A font that is not one is left out.
 */
export function parseLook(value: unknown): HostLook | null {
  const r = record(value);
  if (!r || (r.theme !== 'light' && r.theme !== 'dark')) return null;
  const t = record(r.tokens);
  if (!t) return null;
  const tokens: Partial<Record<LookToken, string>> = {};
  for (const [name, kind] of Object.entries(LOOK_TOKENS) as [LookToken, (typeof LOOK_TOKENS)[LookToken]][]) {
    const raw = t[name];
    if (typeof raw !== 'string') continue;
    const text = raw.trim();
    if (text && text.length <= LIMITS.lookValue && LOOK_VALUE[kind](text)) tokens[name] = text;
  }
  const look: HostLook = { theme: r.theme, tokens };
  if (Array.isArray(r.fonts)) {
    const fonts = r.fonts
      .slice(0, LIMITS.lookFonts)
      .map(readFont)
      .filter((f): f is HostFont => f !== null);
    if (fonts.length) look.fonts = fonts;
  }
  return look;
}

/** Simple or Pro (the welcome's `mode`, a ui.mode event's `data.mode`), or null. */
export function parseUiMode(value: unknown): UiMode | null {
  return value === 'simple' || value === 'pro' ? value : null;
}

const MATERIAL_SOURCES: readonly MaterialSource[] = ['spool', 'loaded', 'heaters', 'table'];

/** A temperature in °C, rounded, from 0 to `max`; null for none or anything else. */
const temperature = (value: unknown, max: number): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max ? Math.round(value) : null;

/** A material as the host describes it, or null when it is not one (no name, an unknown source). */
export function parseHostMaterial(value: unknown): HostMaterial | null {
  const r = record(value);
  if (!r) return null;
  const name = displayText(r.name);
  if (!name || !MATERIAL_SOURCES.includes(r.source as MaterialSource)) return null;
  const colour = typeof r.colour === 'string' && /^#?[0-9a-f]{6}$/i.test(r.colour.trim()) ? `#${r.colour.trim().replace(/^#/, '').toUpperCase()}` : null;
  const material: HostMaterial = {
    name,
    type: displayText(r.type, 32) || null,
    colour,
    nozzle: temperature(r.nozzle, 500),
    bed: temperature(r.bed, 200),
    source: r.source as MaterialSource,
  };
  if (typeof r.remaining === 'number' && Number.isFinite(r.remaining) && r.remaining >= 0) material.remaining = Math.round(r.remaining);
  return material;
}

/** printer.setup's data, or null when it is not an object. A loaded material that is not one reads as none. */
export function parseHostSetup(value: unknown): HostSetup | null {
  const r = record(value);
  if (!r) return null;
  const materials = Array.isArray(r.materials)
    ? r.materials
        .slice(0, LIMITS.materials)
        .map(parseHostMaterial)
        .filter((m): m is HostMaterial => m !== null)
    : [];
  return { material: parseHostMaterial(r.material), materials };
}

// ---------------------------------------------------------------------------
// Requests (the host's side)
// ---------------------------------------------------------------------------

/**
 * A port message as a request. null: not a request (no `v: 1`, no op, or an answer or an event), ignored. Otherwise
 * the operation with its parameters checked, or the failure to answer with (`id` when it could be read, `printer` when
 * the key could): an operation this version does not have is `unsupported`, a parameter that breaks its rule
 * `bad-request`, a Moonraker method outside the read allowlist `not-allowed`.
 */
export function parseRequest(data: unknown): { ok: true; id: number; request: OpRequest } | { ok: false; id: number | null; printer: string | null; error: BridgeError } | null {
  const r = record(data);
  if (!r || r.v !== 1 || typeof r.op !== 'string' || 're' in r || 'event' in r) return null;
  const id = isId(r.id) ? r.id : null;
  const params = record(r.params);
  const printer = params && isPrinterKey(params.printer) ? params.printer : null;
  const failure = (error: BridgeError) => ({ ok: false as const, id, printer, error });
  if (id === null) return failure(bad('id must be a positive integer'));
  if (!Object.prototype.hasOwnProperty.call(OPS, r.op)) return failure({ kind: 'unsupported', message: `Unknown operation "${r.op.slice(0, 64)}"` });
  const op = r.op as BridgeOp;
  if (!params) return failure(bad('params must be an object'));
  if (op === 'printer.get') {
    if (params.printer !== undefined && params.printer !== null && printer === null) return failure(bad('printer must be a printer key'));
    return { ok: true, id, request: { op, printer } };
  }
  if (printer === null) return failure(bad('params.printer must be a printer key'));
  const read = readOpParams(op, params, printer);
  if (typeof read === 'string') return failure(bad(read));
  if ('kind' in read) return failure(read);
  return { ok: true, id, request: read };
}

function readOpParams(op: Exclude<BridgeOp, 'printer.get'>, p: Record<string, unknown>, printer: string): OpRequest | BridgeError | string {
  switch (op) {
    case 'status.watch': {
      const objects = readObjects(p.objects);
      return typeof objects === 'string' ? objects : { op, printer, objects };
    }
    case 'moonraker.read':
      return readMoonrakerParams(p, printer);
    case 'files.upload': {
      // The host builds the body; a client never names the root, a path inside it, or a print.
      for (const field of ['print', 'path', 'root']) if (field in p) return `files.upload takes no "${field}"`;
      const problem = pathProblem(p.name);
      if (problem) return problem;
      if (!isInt(p.size, 0, LIMITS.uploadBytes)) return `size must be a whole number of bytes, at most ${LIMITS.uploadBytes}`;
      if (typeof p.checksum !== 'string' || !CHECKSUM_RE.test(p.checksum)) return 'checksum must be a SHA-256 in lowercase hex';
      if (!(p.bytes instanceof ArrayBuffer)) return 'bytes must be an ArrayBuffer';
      if (p.bytes.byteLength !== p.size) return 'bytes must be size bytes long';
      return { op, printer, name: p.name as string, size: p.size, checksum: p.checksum, bytes: p.bytes };
    }
    case 'print.request': {
      const paths = readPaths(p.paths);
      if (typeof paths === 'string') return paths;
      if (p.mode !== 'start' && p.mode !== 'queue') return "mode must be 'start' or 'queue'";
      if (p.plateClear !== 'ask' && p.plateClear !== 'not-needed') return "plateClear must be 'ask' or 'not-needed'";
      return { op, printer, paths, mode: p.mode, plateClear: p.plateClear };
    }
    case 'queue.add': {
      const paths = readPaths(p.paths);
      return typeof paths === 'string' ? paths : { op, printer, paths };
    }
    case 'print.cancel': {
      const problem = pathProblem(p.path);
      return problem ?? { op, printer, path: p.path as string };
    }
    case 'cancel':
      return isId(p.id) ? { op, printer, id: p.id } : 'id must be a request id';
  }
}

/** moonraker.read's method and parameters: the read allowlist, each parameter checked. */
function readMoonrakerParams(p: Record<string, unknown>, printer: string): OpRequest | BridgeError | string {
  const method = p.method;
  if (typeof method !== 'string' || !(READ_METHODS as readonly string[]).includes(method)) {
    return { kind: 'not-allowed', message: `moonraker.read does not allow "${String(method).slice(0, 64)}"` };
  }
  const params = p.params === undefined ? {} : record(p.params);
  if (!params) return 'params.params must be an object';
  const only = (...names: string[]) => Object.keys(params).every((k) => names.includes(k));
  const op = 'moonraker.read' as const;
  switch (method as ReadMethod) {
    case 'printer.objects.query': {
      if (!only('objects')) return 'printer.objects.query takes only objects';
      const objects = readObjects(params.objects);
      return typeof objects === 'string' ? objects : { op, printer, method: 'printer.objects.query', params: { objects } };
    }
    case 'printer.info':
    case 'server.info':
    case 'server.job_queue.status':
      if (!only()) return `${method} takes no parameters`;
      return { op, printer, method: method as 'printer.info', params: {} };
    case 'server.files.metadata': {
      if (!only('filename')) return 'server.files.metadata takes only filename';
      const problem = pathProblem(params.filename);
      return problem ?? { op, printer, method: 'server.files.metadata', params: { filename: params.filename as string } };
    }
    case 'server.gcode_store':
      if (!only('count') || !isInt(params.count, 1, LIMITS.gcodeStore)) return `server.gcode_store takes only count, 1 to ${LIMITS.gcodeStore}`;
      return { op, printer, method: 'server.gcode_store', params: { count: params.count } };
    case 'server.history.list': {
      if (!only('limit', 'order') || !isInt(params.limit, 1, LIMITS.history)) return `server.history.list takes limit, 1 to ${LIMITS.history}, and order`;
      const order = params.order ?? 'desc';
      if (order !== 'asc' && order !== 'desc') return "order must be 'asc' or 'desc'";
      return { op, printer, method: 'server.history.list', params: { limit: params.limit, order } };
    }
  }
}

// ---------------------------------------------------------------------------
// Answers and events (the client's side)
// ---------------------------------------------------------------------------

export type ClientIncoming =
  | { kind: 'result'; re: number; printer: string | null; result: unknown }
  | { kind: 'failure'; re: number; printer: string | null; error: PrinterError }
  | { kind: 'progress'; re: number; printer: string; progress: UploadStep }
  | { kind: 'event'; event: HostEventName; printer: string | null; data: unknown };

/** An upload step from the host, or null. */
export function parseUploadStep(value: unknown): UploadStep | null {
  const r = record(value);
  if (!r) return null;
  if (r.step === 'checking') return { step: 'checking' };
  if (r.step !== 'sending' || !isInt(r.total, 0, LIMITS.uploadBytes)) return null;
  if (r.sent !== null && !isInt(r.sent, 0, r.total)) return null;
  return { step: 'sending', sent: r.sent as number | null, total: r.total };
}

/**
 * A port message as the client reads it; null for anything it ignores (not version 1, an unknown event, a malformed
 * message). A failure's error is read by parseBridgeError (errors/parse.ts), as an untrusted host's: an unknown kind is
 * `protocol`.
 */
export function parseIncoming(data: unknown): ClientIncoming | null {
  const r = record(data);
  if (!r || r.v !== 1) return null;
  const printer = r.printer === null ? null : isPrinterKey(r.printer) ? r.printer : undefined;
  if (printer === undefined) return null;
  if (typeof r.event === 'string') {
    if (!Object.prototype.hasOwnProperty.call(HOST_EVENTS, r.event)) return null;
    return { kind: 'event', event: r.event as HostEventName, printer, data: r.data };
  }
  if (!isId(r.re)) return null;
  if ('error' in r) return { kind: 'failure', re: r.re, printer, error: parseBridgeError(r.error) };
  if ('progress' in r) {
    const progress = parseUploadStep(r.progress);
    return progress && printer ? { kind: 'progress', re: r.re, printer, progress } : null;
  }
  if ('result' in r) return { kind: 'result', re: r.re, printer, result: r.result };
  return null;
}

/** printer.status's data: the changed fields (or the whole set), and Klipper's clock when the host knows it. */
export function parseStatusData(data: unknown): { status: Record<string, Record<string, unknown>>; eventtime: number | null } | null {
  const r = record(data);
  const s = record(r?.status);
  if (!r || !s) return null;
  const status: Record<string, Record<string, unknown>> = {};
  for (const [object, fields] of Object.entries(s)) {
    const f = record(fields);
    if (f) status[object] = f;
  }
  return { status, eventtime: typeof r.eventtime === 'number' && Number.isFinite(r.eventtime) ? r.eventtime : null };
}

/** printer.gcode's data: the console lines, each cut to its limit; null when it is not that. */
export function parseGcodeData(data: unknown): string[] | null {
  const r = record(data);
  if (!r || !Array.isArray(r.lines)) return null;
  return r.lines
    .slice(0, LIMITS.lines)
    .filter((l): l is string => typeof l === 'string')
    .map((l) => l.slice(0, LIMITS.line));
}

/**
 * A print.request's result, or null when it is not one: a decision the request's `mode` cannot answer (a start that
 * says queued, a queue request that says started) is not one. Without `mode`, any decision is read.
 */
export function parsePrintDecision(value: unknown, paths: readonly string[], mode?: PrintMode): PrintDecision | null {
  const r = record(value);
  if (!r || typeof r.decision !== 'string') return null;
  const allowed: readonly string[] = mode ? PRINT_DECISIONS[mode] : [...PRINT_DECISIONS.start, ...PRINT_DECISIONS.queue];
  if (!allowed.includes(r.decision)) return null;
  if (r.decision === 'started') return typeof r.startedPath === 'string' && r.startedPath === paths[0] ? { decision: 'started', startedPath: r.startedPath } : null;
  return { decision: r.decision as Exclude<PrintDecision['decision'], 'started'> };
}

/** A queue.add's result, or null when it is not one ({queued} must be a boolean). */
export function parseQueueAnswer(value: unknown): QueueAnswer | null {
  const r = record(value);
  return r && typeof r.queued === 'boolean' ? { queued: r.queued } : null;
}

/**
 * An error as a failure message carries it: the kind, the status and action when there are some, and as its message
 * the other side's own words when it gave some (`detail`), which the client shows as the printer's message.
 */
export function bridgeError(error: PrinterError | BridgeError): BridgeError {
  const words = 'detail' in error && error.detail ? error.detail : error.message;
  const out: BridgeError = { kind: error.kind, message: cleanText(words) || error.kind };
  if (error.status !== undefined) out.status = error.status;
  if (error.action !== undefined) out.action = error.action;
  return out;
}
