// SPDX-License-Identifier: Apache-2.0
// Vendored from @muon3d/printer-client 0.2.0 (src/bridge/host.ts), Copyright 2026 Muon 3D
// Technologies Limited, under the Apache License 2.0 (vendor/printer-client/LICENSE and NOTICE). Changed for
// Fluidd by tools/vendor-printer-client.cjs: relative imports without ".ts"; Object.hasOwn as hasOwnProperty.call.
// The host's side of printer-bridge/1 (protocol.ts), without a framework: the page that frames a printer client (Fluidd's
// /slice, the reference host in the tests) creates one BridgeHost for its frame and gives it an adapter, its own
// connection to the printer it has selected. The helper is the boundary: the frame may be hostile (a compromised client
// origin framed in every console user's Fluidd), so everything a request may do is decided here, never by the frame.
//
// - The handshake. createBridgeHost() listens before the host sets the frame's src. It answers a hello only from the
//   frame's own window and from the origin of the src it set, with one welcome per hello (a new nonce, as a reload
//   sends, starts a new session and ends the old one: its port, its running requests, its uploads and approvals). It
//   never reads document.referrer.
// - The selected printer. Every request names a printer key; one that is not the host's selection now is refused with
//   `printer-changed`, and when the selection changes (printerChanged()) the frame is told first (printer.changed),
//   then every request still running for the old printer ends with `printer-changed` and its status watch stops. A
//   write (an upload, a print, a queue entry, a cancel) also ends when its printer becomes watch-only or offline, unless
//   the printer already has it; each step of a write checks the selection again.
// - Reads: Moonraker's read allowlist only (READ_METHODS), each parameter checked before the adapter puts it in a URL.
//   Status comes from the host's own subscription (the adapter's status feed), at most 4 events a second.
// - Uploads: the helper builds the multipart body itself (multipart/build.ts: root, checksum, file; never print, never
//   a path) from the name, checksum and bytes the frame sent. It never replaces a file in the printer's queue, the file
//   it is printing, or a file this session did not write: the upload is stored under the next free name instead
//   (a_2.gcode, a_3.gcode, …), and the answer names it. Each stored path is recorded, per printer, in this session's
//   upload set.
// - The start is the host's. print.request is refused unless every path is in the upload set for that printer and was
//   uploaded within 30 minutes. The host then shows its own dialog (the adapter's confirm: "Print ‹file› on
//   ‹printer›?", "Plate is clear", Upload only, Print). For a start, the host reads the printer's last job itself and
//   asks "Plate is clear" whenever that job deposited material or the history cannot be read, whatever the frame said
//   (the frame's `ask` only asks more often); a queue entry never asks. On Print, with the printer still selected and
//   the tick given where it was asked, it reads print_stats again: a start needs standby, complete, cancelled or error
//   and starts the first path; a queue needs printing or paused and queues them all. Upload only (and the dialog's ✕
//   or Esc) answers uploaded-only in either mode, and approves nothing. The other paths of a start are approved for
//   queue.add, once each, for 30 minutes, and only while the printer prints or is paused; queue.add shows no dialog
//   (the start's was the one for every path of the send). The frame's `cancel` closes a dialog still open, and nothing
//   starts. print.cancel cancels only the job this frame started: that file printing or paused, and (where the printer
//   keeps a history) the first job after the one before the start, so a later print of the same name from the host's
//   own file list is not the frame's to cancel.
// - Viewers never upload or print; a printer the host lists offline answers `offline`.
// - The host's UI (protocol.ts, the file comment), each optional: given a `look`, the helper grants ui.look, puts the
//   look in the welcome and sends each setLook() as ui.look (and as ui.theme, for a client that predates looks); given
//   a `mode`, ui.mode the same way; given `setup`, printer.setup: the selected printer's setup after the welcome, after
//   each printer.changed, and again on setupChanged(). `clientFeatures` is what the welcomed hello listed ([] from a
//   client that predates them), for a host that draws its page differently around a client that uses its look.
//
// An adapter's error reaches the frame as it is only when it is a PrinterError (errors/kinds.ts), so a host that maps
// its printer's answers with errors/parse.ts passes the printer's own words through. Any other error (a fetch's, a
// socket's: they may name URLs and tokens) reaches the frame as "The host could not do it"; its words go to the log.
//
// The adapter's reads answer as Moonraker does, and a read of something that is not there (a missing file's
// metadata, a printer without [history] or [job_queue]) rejects with a PrinterError whose status is 404.
import { buildUploadBody, type UploadBody } from '../multipart/build';
import { unsafeNameReason } from '../multipart/names';
import { isPrinterError, printerError, type PrinterError } from '../errors/kinds';
import { cancelledError, printerChangedError } from '../errors/parse';
import {
  BRIDGE_PROTOCOL,
  bridgeError,
  CAPABILITIES_V1,
  commonVersion,
  LIMITS,
  OPS,
  parseHello,
  parseRequest,
  type BridgeError,
  type BridgeObjects,
  type BridgePrinter,
  type Density,
  type HostLook,
  type HostSetup,
  type OpRequest,
  type PlateClearAsk,
  type PrintDecision,
  type PrintMode,
  type ReadMethod,
  type Theme,
  type UiMode,
  type UploadStep,
  type Welcome,
} from './protocol';

/** Klipper's objects with their fields, as a status feed holds them. */
export type HostStatus = Record<string, Record<string, unknown>>;

/**
 * The host's dialog, asked by print.request. `plateClear` is the host's own decision (see the file comment); `signal`
 * aborts when the request ends first (the printer changed, the frame cancelled): the dialog then closes.
 */
export interface ConfirmRequest {
  printer: BridgePrinter;
  paths: string[];
  mode: PrintMode;
  plateClear: PlateClearAsk;
  signal: AbortSignal;
}
/** Print (with whether "Plate is clear" was ticked), or Upload only (also the answer for a dialog closed with ✕ or Esc). */
export type ConfirmAnswer = { choice: 'print'; plateClear: boolean } | { choice: 'upload-only' };

/** The host's own status of a printer: now, then each change (its existing subscription; never a second one). */
export interface StatusFeed {
  snapshot(): { status: HostStatus; eventtime: number | null };
  subscribe(on: (changed: HostStatus, eventtime: number | null) => void): () => void;
}

/** The host's connection to its printers. Every method is for the printer `key`, which the helper has checked. */
export interface HostAdapter {
  /** The printer the host has selected now, or null. */
  selected(): BridgePrinter | null;
  /**
   * A read from the allowlist, its parameters checked (URL-encode them all the same): Moonraker's result, or a
   * PrinterError (status 404 for something that is not there).
   */
  read(key: string, method: ReadMethod, params: Record<string, unknown>, signal: AbortSignal): Promise<unknown>;
  /** print_stats' state and filename, read from the printer now (not from the subscription). */
  printStats(key: string, signal: AbortSignal): Promise<{ state: string; filename: string }>;
  /** Sends the body the helper built; reports its steps; resolves to where the printer stored the file. */
  upload(key: string, body: UploadBody, options: { signal: AbortSignal; onStep: (step: UploadStep) => void }): Promise<{ path: string; size: number }>;
  start(key: string, path: string, signal: AbortSignal): Promise<void>;
  queue(key: string, paths: string[], signal: AbortSignal): Promise<void>;
  cancelPrint(key: string, signal: AbortSignal): Promise<void>;
  confirm(request: ConfirmRequest): Promise<ConfirmAnswer>;
  /** The status feed of `key`, or null when the host has none. */
  status(key: string): StatusFeed | null;
}

/** The frame: its window now (iframe.contentWindow) and the origin of the src the host set. */
export interface HostFrame {
  window(): unknown;
  origin: string;
}

/** Where the hello arrives: the host's own window. */
export interface HostMessageTarget {
  addEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
  removeEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
}

interface Port {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  onmessage: ((event: MessageEvent) => void) | null;
  close(): void;
}

/** What the helper did that a host may log (refusals, decisions, its adapter's own errors); never needed to work. */
export type HostLogEntry =
  | { kind: 'welcome'; nonce: string; version: number }
  | { kind: 'ignored'; why: string }
  | { kind: 'refused'; op: string; id: number | null; error: BridgeError }
  | { kind: 'answered'; op: string; id: number; result: unknown }
  | { kind: 'state'; data: unknown }
  /** An adapter's error that is not a PrinterError: the frame was told only "The host could not do it". */
  | { kind: 'adapter-error'; op: string; id: number; error: unknown };

export interface BridgeHostOptions {
  frame: HostFrame;
  target: HostMessageTarget;
  /** The host's name and version, for the client's logs. */
  host: string;
  hostVersion: string;
  /**
   * Default: every capability of version 1, with ui.look, ui.mode and printer.setup for the options below that are
   * given. Given, the list is exactly what the welcome grants.
   */
  capabilities?: readonly string[];
  theme: Theme;
  density?: Density;
  /** The host's look (ui.look): the client draws itself as a part of the host's page. */
  look?: HostLook;
  /** The host's Simple or Pro (ui.mode). */
  mode?: UiMode;
  /** The setup of printer `key` (printer.setup): what it has loaded and the host's material table; null for none. */
  setup?: (key: string) => HostSetup | null;
  adapter: HostAdapter;
  /** The client's slicer.state events (Fluidd's leave prompt reads `dirty`). */
  onState?: (state: Record<string, unknown>) => void;
  log?: (entry: HostLogEntry) => void;
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
  createChannel?: () => { port1: Port; port2: unknown };
}

export interface BridgeHost {
  /** The host's selection, role, route or online state changed: tells the frame, ends what can no longer run. */
  printerChanged(): void;
  /** Console lines of `key` (from the host's own notify_gcode_response handling): sent when it is the selection. */
  gcode(key: string, lines: readonly string[]): void;
  setTheme(theme: Theme): void;
  setDensity(density: Density): void;
  /** The host's look changed (its theme too): ui.look, then ui.theme. Granted only when created with a look. */
  setLook(look: HostLook): void;
  /** The host's Simple or Pro changed: ui.mode. Granted only when created with a mode. */
  setMode(mode: UiMode): void;
  /** The selected printer's setup changed (a spool, the heaters, the table): printer.setup, read again. */
  setupChanged(): void;
  /** Whether a frame has been welcomed (and not closed since). */
  readonly connected: boolean;
  /** The features the welcomed client's hello listed; [] before a welcome and from a client that lists none. */
  readonly clientFeatures: readonly string[];
  close(): void;
}

/** Why a request's signal aborted (besides a PrinterError: a write its printer can no longer take). */
const CHANGED = 'printer-changed';
const CANCELLED = 'cancelled';

const BUSY = ['printing', 'paused'];
const STARTABLE = ['standby', 'complete', 'cancelled', 'error'];
const WRITES: readonly string[] = ['files.upload', 'print.request', 'queue.add', 'print.cancel'];
/** The names an upload tries before it gives up: its own, then _2 … _100. */
const FREE_NAMES = 100;
const samePath = (a: string, b: string) => a.replace(/^\/+/, '') === b.replace(/^\/+/, '');

/** `status` with only what `objects` asks for (null when none is left). */
function pick(status: HostStatus, objects: BridgeObjects): HostStatus | null {
  const out: HostStatus = {};
  for (const [object, values] of Object.entries(status)) {
    if (!Object.prototype.hasOwnProperty.call(objects, object)) continue;
    const fields = objects[object];
    const picked = fields === null ? { ...values } : Object.fromEntries(Object.entries(values).filter(([f]) => fields.includes(f)));
    if (Object.keys(picked).length) out[object] = picked;
  }
  return Object.keys(out).length ? out : null;
}

function union(a: BridgeObjects, b: BridgeObjects): BridgeObjects {
  const out: BridgeObjects = { ...a };
  for (const [object, fields] of Object.entries(b)) {
    const have = out[object];
    out[object] = !Object.prototype.hasOwnProperty.call(out, object) ? fields : have === null || fields === null ? null : [...new Set([...have, ...fields])];
  }
  return out;
}

/** An adapter's error as a PrinterError, when it is one (also inside an Error's `error`, as links throw them); else null. */
function printerErrorOf(err: unknown): PrinterError | null {
  if (isPrinterError(err)) return err;
  const inner = typeof err === 'object' && err !== null ? (err as { error?: unknown }).error : undefined;
  return isPrinterError(inner) ? inner : null;
}

/** Whether an adapter's read failed because what it asked for is not there (a 404). */
const notThere = (err: unknown) => printerErrorOf(err)?.status === 404;

/** Why `printer` takes no write: watch-only, or offline. Null: it takes one. */
function writeRefusal(printer: BridgePrinter): PrinterError | null {
  if (printer.role === 'viewer') return printerError('not-allowed', 'This printer is shared to watch only');
  if (!printer.online) return printerError('offline', 'The printer is offline');
  return null;
}

/** `name` numbered: a.gcode → a_2.gcode (before the extension, as the slicer numbers its own). */
function numbered(name: string, n: number): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? `${name.slice(0, dot)}_${n}${name.slice(dot)}` : `${name}_${n}`;
}

/** A job of the printer's history, as the helper reads it. */
interface Job {
  id: string | null;
  filename: string;
  status: string;
  filamentUsed: number;
}

function readJobs(value: unknown): Job[] {
  const jobs = typeof value === 'object' && value !== null ? (value as { jobs?: unknown }).jobs : undefined;
  if (!Array.isArray(jobs)) return [];
  return jobs.map((j) => {
    const r = typeof j === 'object' && j !== null ? (j as Record<string, unknown>) : {};
    return {
      id: typeof r.job_id === 'string' ? r.job_id : null,
      filename: typeof r.filename === 'string' ? r.filename : '',
      status: typeof r.status === 'string' ? r.status : '',
      filamentUsed: typeof r.filament_used === 'number' && Number.isFinite(r.filament_used) ? r.filament_used : 0,
    };
  });
}

/** A job that ended having put material on the plate: the next start then asks "Plate is clear". */
const deposited = (job: Job | undefined) => job !== undefined && job.status !== 'in_progress' && job.filamentUsed > 0;

/** What a print this frame started is: its printer's newest job before the start (null: none; undefined: unknown). */
interface Started {
  before: string | null | undefined;
}

interface Run {
  printer: string;
  abort: AbortController;
  op: string;
  /** The printer has the write (its start, queue entry or cancel was sent): its answer stands. */
  committed: boolean;
  /** The frame's `cancel` ends it (an upload; a print.request until its dialog is answered). */
  cancellable: boolean;
}

interface Session {
  nonce: string;
  port: Port;
  version: number;
  granted: Set<string>;
  /** `<key>\n<path>` → when it was uploaded (removed once started or queued). */
  uploads: Map<string, number>;
  /** `<key>\n<path>`: every file this session stored, which a later upload of the same name may replace. */
  written: Set<string>;
  /** `<key>\n<path>` → when its print.request approved it for queue.add. */
  approvals: Map<string, number>;
  /** `<key>\n<path>`: started through this frame. */
  started: Map<string, Started>;
  running: Map<number, Run>;
  watch: { printer: string; objects: BridgeObjects; stop: () => void; pending: HostStatus | null; eventtime: number | null; timer: unknown; last: number } | null;
  /** What the welcomed hello listed (protocol.ts readFeatures). */
  features: readonly string[];
}

const entry = (key: string, path: string) => `${key}\n${path.replace(/^\/+/, '')}`;

/**
 * The host's side of the bridge for one frame (see the file comment). Call it before setting the frame's src: it
 * listens from now on. close() stops listening and ends the session.
 */
export function createBridgeHost(options: BridgeHostOptions): BridgeHost {
  const { frame, target, adapter } = options;
  const capabilities = [
    ...(options.capabilities ?? [
      ...CAPABILITIES_V1,
      ...(options.look ? ['ui.look'] : []),
      ...(options.mode ? ['ui.mode'] : []),
      ...(options.setup ? ['printer.setup'] : []),
    ]),
  ];
  const now = options.now ?? (() => Date.now());
  const setTimer = options.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = options.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  const createChannel = options.createChannel ?? (() => new MessageChannel() as unknown as { port1: Port; port2: unknown });
  const log = options.log ?? (() => {});
  let theme = options.theme;
  let density = options.density;
  let look = options.look ?? null;
  let mode = options.mode ?? null;
  let session: Session | null = null;
  let closed = false;

  const post = (s: Session, message: unknown) => {
    try {
      s.port.postMessage(message);
    } catch {
      // The frame has gone; its session ends with the next hello or close().
    }
  };
  const event = (s: Session, name: string, printer: string | null, data: unknown) => post(s, { v: 1, event: name, printer, data });

  /** printer.setup of the selected printer, when the session was granted it and the host has one. */
  const sendSetup = (s: Session) => {
    if (!s.granted.has('printer.setup') || !options.setup) return;
    const key = adapter.selected()?.key;
    if (!key) return;
    let setup: HostSetup | null = null;
    try {
      setup = options.setup(key);
    } catch (err) {
      return log({ kind: 'ignored', why: `the host's setup failed: ${err instanceof Error ? err.message : String(err)}` });
    }
    if (setup) event(s, 'printer.setup', key, setup);
  };

  const endSession = (s: Session) => {
    for (const run of s.running.values()) run.abort.abort(CANCELLED);
    s.running.clear();
    stopWatch(s);
    s.port.onmessage = null;
    s.port.close();
  };

  const stopWatch = (s: Session) => {
    if (!s.watch) return;
    s.watch.stop();
    if (s.watch.timer !== null) clearTimer(s.watch.timer);
    s.watch = null;
  };

  // ---- the handshake --------------------------------------------------------------------------------------------
  const onWindowMessage = (e: MessageEvent) => {
    if (closed) return;
    const hello = parseHello(e.data);
    if (!hello) return;
    if (e.source === null || e.source !== frame.window() || e.origin !== frame.origin) return log({ kind: 'ignored', why: `a hello from ${e.origin} that is not the frame` });
    if (session && session.nonce === hello.nonce) return; // a repeat of the hello already welcomed
    const version = commonVersion(hello.versions);
    if (version === null) return log({ kind: 'ignored', why: `a hello with no common version (${hello.versions.join(', ')})` });
    if (session) endSession(session);
    const channel = createChannel();
    const s: Session = {
      nonce: hello.nonce,
      port: channel.port1,
      version,
      granted: new Set(capabilities),
      uploads: new Map(),
      written: new Set(),
      approvals: new Map(),
      started: new Map(),
      running: new Map(),
      watch: null,
      features: hello.features ?? [],
    };
    session = s;
    channel.port1.onmessage = (m: MessageEvent) => onPortMessage(s, m.data);
    const welcome: Welcome = {
      protocol: BRIDGE_PROTOCOL,
      type: 'welcome',
      version,
      nonce: hello.nonce,
      host: options.host,
      hostVersion: options.hostVersion,
      capabilities: [...capabilities],
      theme,
      ...(density ? { density } : {}),
      ...(look && s.granted.has('ui.look') ? { look } : {}),
      ...(mode && s.granted.has('ui.mode') ? { mode } : {}),
    };
    (e.source as { postMessage(message: unknown, targetOrigin: string, transfer: unknown[]): void }).postMessage(welcome, frame.origin, [channel.port2]);
    log({ kind: 'welcome', nonce: hello.nonce, version });
    // Queued on the port behind the welcome: the client reads it once it has the port.
    sendSetup(s);
  };
  target.addEventListener('message', onWindowMessage);

  // ---- requests -------------------------------------------------------------------------------------------------
  const fail = (s: Session, op: string, id: number | null, printer: string | null, error: PrinterError | BridgeError) => {
    const e = bridgeError(error);
    log({ kind: 'refused', op, id, error: e });
    if (id !== null) post(s, { v: 1, re: id, printer, error: e });
  };
  const answer = (s: Session, op: string, id: number, printer: string | null, result: unknown) => {
    log({ kind: 'answered', op, id, result });
    post(s, { v: 1, re: id, printer, result });
  };

  const onPortMessage = (s: Session, data: unknown) => {
    if (session !== s || closed) return;
    const r = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : null;
    // The client's events.
    if (r && r.v === 1 && typeof r.event === 'string' && !('re' in r)) {
      if (r.event === 'slicer.state' && typeof r.data === 'object' && r.data !== null && !Array.isArray(r.data)) {
        log({ kind: 'state', data: r.data });
        options.onState?.(r.data as Record<string, unknown>);
      }
      return;
    }
    const parsed = parseRequest(data);
    if (!parsed) return;
    const op = r && typeof r.op === 'string' ? r.op.slice(0, 64) : '?';
    if (!parsed.ok) return fail(s, op, parsed.id, parsed.printer, parsed.error);
    const { id, request } = parsed;
    const capability = OPS[request.op];
    if (capability !== null && !s.granted.has(capability)) return fail(s, op, id, request.printer, { kind: 'not-allowed', message: `${request.op} was not granted` });
    void handle(s, id, request);
  };

  /** The selected printer when it is `key`, else null. */
  const selectedAs = (key: string): BridgePrinter | null => {
    const sel = adapter.selected();
    return sel && sel.key === key ? sel : null;
  };

  /**
   * Runs `work` as a request of `printer` that a switch (or, for a write, the printer becoming watch-only or offline, or
   * the frame's cancel) can end. `run` marks the points of no return: commit() before a write the printer then has, and
   * settled() when the frame's cancel can no longer end it.
   */
  const run = async (s: Session, id: number, op: string, printer: string, work: (signal: AbortSignal, run: { commit(): void; settled(): void }) => Promise<unknown>) => {
    const abort = new AbortController();
    const running: Run = { printer, abort, op, committed: false, cancellable: op === 'files.upload' || op === 'print.request' };
    s.running.set(id, running);
    try {
      const result = await work(abort.signal, {
        commit: () => void ((running.committed = true), (running.cancellable = false)),
        settled: () => void (running.cancellable = false),
      });
      if (abort.signal.aborted) throw abort.signal.reason;
      if (session === s) answer(s, op, id, printer, result);
    } catch (err) {
      if (session !== s) return;
      const reason: unknown = abort.signal.aborted ? abort.signal.reason : null;
      if (reason === CHANGED) return fail(s, op, id, printer, printerChangedError());
      if (reason === CANCELLED) return fail(s, op, id, printer, cancelledError());
      if (isPrinterError(reason)) return fail(s, op, id, printer, reason);
      const known = printerErrorOf(err);
      if (known) return fail(s, op, id, printer, known);
      // Not the printer's words: they stay in the host's log (a URL, a token), the frame reads a fixed sentence.
      log({ kind: 'adapter-error', op, id, error: err });
      fail(s, op, id, printer, printerError('printer', 'The host could not do it'));
    } finally {
      s.running.delete(id);
    }
  };

  /** A request's own check failure, thrown inside run(). */
  const refuse = (kind: PrinterError['kind'], message: string): never => {
    throw printerError(kind, message);
  };

  /** The printer's newest jobs (newest first), or null when it keeps no history or it cannot be read now. */
  const lastJobs = async (key: string, limit: number, signal: AbortSignal): Promise<Job[] | null> => {
    try {
      return readJobs(await adapter.read(key, 'server.history.list', { limit, order: 'desc' }, signal));
    } catch (err) {
      if (signal.aborted) throw err;
      return null;
    }
  };

  /** The files in the printer's queue (none when it has no queue). */
  const queuedNames = async (key: string, signal: AbortSignal): Promise<string[]> => {
    try {
      const value = await adapter.read(key, 'server.job_queue.status', {}, signal);
      const jobs = typeof value === 'object' && value !== null ? (value as { queued_jobs?: unknown }).queued_jobs : undefined;
      return Array.isArray(jobs) ? jobs.map((j) => (typeof j === 'object' && j !== null ? (j as { filename?: unknown }).filename : null)).filter((f): f is string => typeof f === 'string') : [];
    } catch (err) {
      if (notThere(err) && !signal.aborted) return [];
      throw err;
    }
  };

  /** Whether the printer has a file of that name. */
  const exists = async (key: string, filename: string, signal: AbortSignal): Promise<boolean> => {
    try {
      await adapter.read(key, 'server.files.metadata', { filename }, signal);
      return true;
    } catch (err) {
      if (notThere(err) && !signal.aborted) return false;
      throw err;
    }
  };

  /**
   * Where an upload named `name` goes: that name, unless the file is queued or loaded, or is there and this session did
   * not write it; then the next free one.
   */
  const placeFor = async (s: Session, key: string, name: string, signal: AbortSignal): Promise<string> => {
    const [queued, stats] = await Promise.all([queuedNames(key, signal), adapter.printStats(key, signal)]);
    const loaded = BUSY.includes(stats.state) ? stats.filename : null;
    const held = (n: string) => queued.some((q) => samePath(q, n)) || (loaded !== null && samePath(loaded, n));
    for (let i = 1; i <= FREE_NAMES; i++) {
      const candidate = i === 1 ? name : numbered(name, i);
      if (unsafeNameReason(candidate)) break;
      if (held(candidate)) continue;
      if (s.written.has(entry(key, candidate)) || !(await exists(key, candidate, signal))) return candidate;
    }
    return refuse('busy', `The printer has no free name like "${name.slice(0, 64)}"`);
  };

  const handle = async (s: Session, id: number, req: OpRequest): Promise<void> => {
    if (req.op === 'printer.get') {
      const sel = adapter.selected();
      return answer(s, req.op, id, sel?.key ?? null, { printer: sel });
    }
    if (req.op === 'cancel') {
      const running = s.running.get(req.id);
      if (running && running.printer === req.printer && running.cancellable) running.abort.abort(CANCELLED);
      return answer(s, req.op, id, req.printer, {});
    }
    const sel = selectedAs(req.printer);
    if (!sel) return fail(s, req.op, id, req.printer, printerChangedError());
    if (WRITES.includes(req.op)) {
      const refusal = writeRefusal(sel);
      if (refusal) return fail(s, req.op, id, req.printer, refusal);
    }
    const key = req.printer;
    /** The printer, when it is still the selection and still takes writes; else what the request ends with. */
    const writable = (): BridgePrinter => {
      const current = selectedAs(key);
      if (!current) throw printerChangedError();
      const refusal = writeRefusal(current);
      if (refusal) throw refusal;
      return current;
    };

    switch (req.op) {
      case 'status.watch':
        return watch(s, id, key, req.objects);
      case 'moonraker.read':
        return run(s, id, req.op, key, (signal) => adapter.read(key, req.method, req.params, signal));
      case 'files.upload':
        return run(s, id, req.op, key, async (signal) => {
          const name = await placeFor(s, key, req.name, signal);
          writable();
          let body: UploadBody;
          try {
            body = buildUploadBody({ name, bytes: req.bytes, checksum: req.checksum });
          } catch (err) {
            return refuse('bad-request', err instanceof Error ? err.message : String(err));
          }
          const onStep = (step: UploadStep) => {
            if (session === s && !signal.aborted) post(s, { v: 1, re: id, printer: key, progress: step });
          };
          onStep({ step: 'sending', sent: 0, total: body.body.byteLength });
          const stored = await adapter.upload(key, body, { signal, onStep });
          s.written.add(entry(key, stored.path));
          writable();
          s.uploads.set(entry(key, stored.path), now());
          return { path: stored.path, size: stored.size };
        });
      case 'print.request':
        return run(s, id, req.op, key, async (signal, step): Promise<PrintDecision> => {
          const at = now();
          const stale = req.paths.find((p) => {
            const when = s.uploads.get(entry(key, p));
            return when === undefined || at - when > LIMITS.approvalMs;
          });
          if (stale !== undefined) refuse('not-allowed', `"${stale}" was not uploaded to this printer by this frame in the last 30 minutes`);
          // The plate-clear rule from the printer's own history: a frame's "not needed" never hides the tick.
          const jobs = req.mode === 'start' ? await lastJobs(key, 1, signal) : null;
          const plateClear: PlateClearAsk = req.mode === 'queue' ? 'not-needed' : req.plateClear === 'ask' || jobs === null || deposited(jobs[0]) ? 'ask' : 'not-needed';
          const choice = await adapter.confirm({ printer: writable(), paths: [...req.paths], mode: req.mode, plateClear, signal });
          if (signal.aborted) throw signal.reason;
          step.settled();
          writable();
          if (choice.choice !== 'print') return { decision: 'uploaded-only' };
          // The dialog cannot print without the tick it asked for; a host whose dialog did is refused here.
          if (plateClear === 'ask' && !choice.plateClear) return { decision: 'uploaded-only' };
          const stats = await adapter.printStats(key, signal);
          writable();
          if (req.mode === 'start') {
            if (!STARTABLE.includes(stats.state)) return { decision: 'not-started' };
            const [first, ...rest] = req.paths;
            step.commit();
            await adapter.start(key, first, signal);
            s.uploads.delete(entry(key, first));
            s.started.set(entry(key, first), { before: jobs === null ? undefined : (jobs[0]?.id ?? null) });
            const approvedAt = now();
            for (const p of rest) s.approvals.set(entry(key, p), approvedAt);
            return { decision: 'started', startedPath: first };
          }
          if (!BUSY.includes(stats.state)) return { decision: 'not-queued' };
          step.commit();
          await adapter.queue(key, [...req.paths], signal);
          for (const p of req.paths) s.uploads.delete(entry(key, p));
          return { decision: 'queued' };
        });
      case 'queue.add':
        return run(s, id, req.op, key, async (signal, step) => {
          const at = now();
          const unapproved = req.paths.find((p) => {
            const when = s.approvals.get(entry(key, p));
            return when === undefined || at - when > LIMITS.approvalMs;
          });
          if (unapproved !== undefined) refuse('not-allowed', `"${unapproved}" was not approved for this printer in this frame in the last 30 minutes`);
          const stats = await adapter.printStats(key, signal);
          writable();
          // A queue entry on a printer that is not busy would heat its bed (preheat_on_queue).
          if (!BUSY.includes(stats.state)) return { queued: false };
          step.commit();
          await adapter.queue(key, [...req.paths], signal);
          for (const p of req.paths) {
            s.approvals.delete(entry(key, p));
            s.uploads.delete(entry(key, p));
          }
          return { queued: true };
        });
      case 'print.cancel':
        return run(s, id, req.op, key, async (signal, step) => {
          const started = s.started.get(entry(key, req.path));
          if (!started) return refuse('not-allowed', `"${req.path}" was not started by this frame`);
          const stats = await adapter.printStats(key, signal);
          writable();
          if (!samePath(stats.filename, req.path) || !BUSY.includes(stats.state)) return { cancelled: false };
          if (started.before !== undefined) {
            // The job printing must be the first one after the start: a later print of the same name (the host's own
            // file list) is not this frame's.
            const jobs = await lastJobs(key, 2, signal);
            writable();
            const [current, previous] = jobs ?? [];
            const ours = current !== undefined && samePath(current.filename, req.path) && current.status === 'in_progress' && (previous?.id ?? null) === started.before;
            if (!ours) {
              s.started.delete(entry(key, req.path));
              return { cancelled: false };
            }
          }
          step.commit();
          await adapter.cancelPrint(key, signal);
          return { cancelled: true };
        });
    }
  };

  // ---- status ---------------------------------------------------------------------------------------------------
  const watch = (s: Session, id: number, key: string, objects: BridgeObjects) => {
    const feed = adapter.status(key);
    if (!feed) return fail(s, 'status.watch', id, key, { kind: 'unsupported', message: 'The host has no status for this printer' });
    if (s.watch && s.watch.printer === key) {
      s.watch.objects = union(s.watch.objects, objects);
    } else {
      stopWatch(s);
      const w: NonNullable<Session['watch']> = { printer: key, objects, stop: () => {}, pending: null, eventtime: null, timer: null, last: 0 };
      const flush = () => {
        w.timer = null;
        if (session !== s || s.watch !== w || !w.pending) return;
        const status = pick(w.pending, w.objects);
        w.pending = null;
        w.last = now();
        if (status) event(s, 'printer.status', key, { status, eventtime: w.eventtime });
      };
      w.stop = feed.subscribe((changed, eventtime) => {
        if (s.watch !== w) return;
        w.pending ??= {};
        for (const [object, fields] of Object.entries(changed)) w.pending[object] = { ...w.pending[object], ...fields };
        w.eventtime = eventtime;
        if (w.timer === null) w.timer = setTimer(flush, Math.max(0, 1000 / LIMITS.statusPerSecond - (now() - w.last)));
      });
      s.watch = w;
    }
    const snapshot = feed.snapshot();
    answer(s, 'status.watch', id, key, { status: pick(snapshot.status, objects) ?? {}, eventtime: snapshot.eventtime });
  };

  const setTheme = (next: Theme) => {
    theme = next;
    if (session && !closed) event(session, 'ui.theme', null, { theme: next });
  };

  return {
    printerChanged() {
      const s = session;
      if (!s || closed) return;
      const next = adapter.selected();
      const key = next?.key ?? null;
      // First the news, then the ends of what can no longer run (their failures follow it on the port): everything of
      // the old printer, and the writes the same printer no longer takes (watch-only, offline) that it has not had yet.
      if (s.granted.has('printer')) event(s, 'printer.changed', key, { printer: next });
      sendSetup(s);
      if (s.watch && s.watch.printer !== key) stopWatch(s);
      const refusal = next ? writeRefusal(next) : null;
      for (const run of s.running.values()) {
        if (run.printer !== key) run.abort.abort(CHANGED);
        else if (refusal && WRITES.includes(run.op) && !run.committed) run.abort.abort(refusal);
      }
    },
    gcode(key, lines) {
      const s = session;
      if (!s || closed || !s.granted.has('gcode') || adapter.selected()?.key !== key) return;
      for (let i = 0; i < lines.length; i += LIMITS.lines) event(s, 'printer.gcode', key, { lines: lines.slice(i, i + LIMITS.lines).map((l) => String(l).slice(0, LIMITS.line)) });
    },
    setTheme,
    setDensity(next) {
      density = next;
      if (session && !closed) event(session, 'ui.density', null, { density: next });
    },
    setLook(next) {
      look = next;
      if (session && !closed && session.granted.has('ui.look')) event(session, 'ui.look', null, next);
      // A client that predates looks still follows the theme.
      if (next.theme !== theme) setTheme(next.theme);
    },
    setMode(next) {
      mode = next;
      if (session && !closed && session.granted.has('ui.mode')) event(session, 'ui.mode', null, { mode: next });
    },
    setupChanged() {
      if (session && !closed) sendSetup(session);
    },
    get connected() {
      return session !== null && !closed;
    },
    get clientFeatures() {
      return session && !closed ? session.features : [];
    },
    close() {
      if (closed) return;
      closed = true;
      target.removeEventListener('message', onWindowMessage);
      if (session) endSession(session);
      session = null;
    },
  };
}
