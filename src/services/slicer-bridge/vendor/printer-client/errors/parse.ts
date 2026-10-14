// SPDX-License-Identifier: Apache-2.0
// Vendored from @muon3d/printer-client 0.4.0 (src/errors/parse.ts), Copyright 2026 Muon 3D
// Technologies Limited, under the Apache License 2.0 (vendor/printer-client/LICENSE and NOTICE). Changed for
// Fluidd by tools/vendor-printer-client.cjs: relative imports without ".ts"; Object.hasOwn as hasOwnProperty.call.
// The parsers: what each side answers, as a PrinterError. One per source, so a route maps its failures the same way
// as every other route:
//
// - the printer (Moonraker, and the gateway in front of it on a remote connection), over HTTP: parsePrinterAnswer;
//   an upload's answer, success included: parseUploadAnswer; over the WebSocket's JSON-RPC: parseRpcError;
// - the network under a request: parseNetworkFailure (fetch), parseXhrFailure (an upload with progress),
//   parseSocketClose (the status WebSocket);
// - the relay connection (the muon-link-web binding's errors and the relay's close codes): parseBindingError,
//   parseCloseCode;
// - the account service (the console): parseConsoleAnswer, parseConsoleFailure, parseConsolePrinter;
// - a host over the bridge: parseBridgeError;
// - the client's own limits: timeoutError, cancelledError, printerChangedError, protocolError.
//
// The texts matched are the other side's own (Moonraker's file manager and its G-code safety pass, its access table,
// the gateway's local answers), re-stated from what they send.
import { UPLOAD_ROOT } from '../multipart/build';
import { cleanText, isErrorKind, printerError, type PrinterError, type Refusal } from './kinds';

/** An HTTP answer: its status, its body (text, bytes, or JSON already parsed) and its Retry-After header. */
export interface HttpAnswer {
  status: number;
  body?: unknown;
  retryAfter?: string | null;
}

/** The relay's close codes that refuse this key or this session, and at capacity: why it closed a connection. */
export const CLOSE_CODES: Readonly<Record<Refusal, number>> = {
  revoked: 0x0403,
  'rate-limited': 0x0404,
  unauthorised: 0x040a,
  expired: 0x040b,
  'alpn-refused': 0x040c,
};

/** The other codes that refuse a connection for good: the key did not authenticate, a policy, no common version. */
const REFUSING_CODES: ReadonlyMap<number, string> = new Map([
  [0x0401, 'auth-failed'],
  [0x0402, 'policy-denied'],
  [0x0407, 'version-unsupported'],
]);

/**
 * Codes that end a connection without refusing it, named for the log: the printer's endpoint closing (0: a restart,
 * an update, a reboot), a protocol fault, the device shutting down, another connection taking this one's place, the
 * device out of reach, the other side gone. These, and codes nobody knows, are `lost`: a reconnect may succeed.
 */
const ENDING_CODES: ReadonlyMap<number, string> = new Map([
  [0, 'closed'],
  [0x0400, 'protocol'],
  [0x0405, 'device-shutdown'],
  [0x0406, 'superseded'],
  [0x0408, 'device-unreachable'],
  [0x0409, 'peer-gone'],
]);

/** The JSON-RPC error code the gateway refuses a WebSocket call with. */
export const RPC_POLICY_REFUSED = -32001;

const decoder = new TextDecoder();

/** The body as JSON when it is JSON, else as text (bytes decoded as UTF-8). */
function bodyValue(body: unknown): unknown {
  let value = body;
  if (value instanceof ArrayBuffer) value = new Uint8Array(value);
  if (value instanceof Uint8Array) value = decoder.decode(value);
  if (typeof value === 'string' && /^\s*[[{]/.test(value)) {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return value;
    }
  }
  return value;
}

const record = (value: unknown): Record<string, unknown> | null => (typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null);

/**
 * The answer's own words, cleaned (cleanText): the message of a JSON error (`{"error": "…"}` from the gateway and the
 * console, `{"error": {"message": "…"}}` from Moonraker, `{"message": "…"}`), an HTML page's title (a proxy's error
 * page), or the text itself. Empty when there are none.
 */
export function answerText(body: unknown): string {
  const value = bodyValue(body);
  if (typeof value === 'string') {
    const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(value);
    if (title) return cleanText(title[1]);
    return /^\s*</.test(value) ? '' : cleanText(value);
  }
  const v = record(value);
  if (!v) return '';
  if (typeof v.error === 'string') return cleanText(v.error);
  const inner = record(v.error);
  if (inner && typeof inner.message === 'string') return cleanText(inner.message);
  if (typeof v.message === 'string') return cleanText(v.message);
  return '';
}

const UPLOAD_REFUSED = 'muon-link refused this upload:';
// The gateway's 400 for a request whose framing it will not read (Transfer-Encoding beside a Content-Length, two
// Content-Lengths, a coding other than chunked): for an upload, a refusal of the body like the ones above.
const FRAMING_REFUSED = 'muon-link refused an ambiguously framed request:';
const POLICY_REFUSED_RE = /^muon-link policy refused (?:this request|this call|`([^`]*)`)(?::\s*(.*))?$/;
const ACCESS_DENIED_RE = /^access-denied:([A-Za-z0-9_.-]+):\s*(.*)$/;
const SAFETY_PASS_RE = /^G-code safety postprocessor (?:exited|timed out)\b/;
const FILE_LOADED_RE = /^File is loaded\b/;

/** A printer's or its gateway's error, from its status and its own (cleaned) words. */
function fromPrinter(status: number, text: string): PrinterError {
  if ((status === 400 || status === 403 || status === 411) && text.startsWith(UPLOAD_REFUSED)) {
    return printerError('upload-refused', `The gateway refused the upload (${status})`, { status, detail: text.slice(UPLOAD_REFUSED.length).trim() });
  }
  if (status === 400 && text.startsWith(FRAMING_REFUSED)) {
    return printerError('upload-refused', "The gateway refused the request's framing (400)", { status, detail: text.slice(FRAMING_REFUSED.length).trim() });
  }
  const policy = POLICY_REFUSED_RE.exec(text);
  if (policy && (status === 403 || status === RPC_POLICY_REFUSED)) {
    const what = policy[1] ? ` ${policy[1]}` : '';
    return printerError('denied', `The gateway's policy refused the request${what}`, { status, detail: policy[2] ?? '' });
  }
  const access = ACCESS_DENIED_RE.exec(text);
  if (access && status === 403) {
    return printerError('denied', `The printer refused the action "${access[1]}"`, { status, action: access[1], detail: access[2] });
  }
  if (status === 422) return printerError('checksum', 'The file the printer wrote does not match its checksum', { status, detail: text });
  if (status === 500 && SAFETY_PASS_RE.test(text)) return printerError('safety-pass', "The printer's G-code safety pass refused the file", { status, detail: text });
  if (status === 403 && FILE_LOADED_RE.test(text)) return printerError('busy', 'The printer has a file of that name loaded', { status, detail: text });
  return printerError('printer', `The printer answered ${status}`, { status, detail: text });
}

/**
 * A printer's HTTP answer (Moonraker, or the gateway's own answer on a remote connection) as an error, or null when it
 * succeeded (2xx). A 403 `access-denied:<action>: …` is `denied` with the action, a gateway policy 403 `denied`, the
 * gateway's upload refusals (400, 403, 411) and its 400 for an ambiguously framed request `upload-refused`, 422
 * `checksum` (whatever its text: Moonraker's is only "Unprocessable Entity"), a 500 from the G-code safety pass
 * `safety-pass`, 403 "File is loaded" `busy`, and anything else `printer` with its message. An upload's answer is
 * read by parseUploadAnswer, which also checks what a success says.
 */
export function parsePrinterAnswer(answer: HttpAnswer): PrinterError | null {
  if (answer.status >= 200 && answer.status < 300) return null;
  return fromPrinter(answer.status, answerText(answer.body));
}

/** What the printer stored an upload as: its path in the gcodes root, which a print start or a queue entry names. */
export interface UploadedFile {
  path: string;
  size: number;
}

/**
 * The answer to POST /server/files/upload: the file the printer stored, or an error. An error status reads as
 * parsePrinterAnswer reads it. A success must be 201 with `{ item: { path, root: "gcodes", size, … }, print_started,
 * print_queued }`; anything else is `protocol`: a 2xx from something in between, a body without the item, and an
 * answer that says a print was started or queued (an upload of this package never asks for one, and the flags are
 * the answer's only proof that none was).
 */
export function parseUploadAnswer(answer: HttpAnswer): UploadedFile | PrinterError {
  const error = parsePrinterAnswer(answer);
  if (error) return error;
  if (answer.status !== 201) return protocolError(`an upload answered ${answer.status}, not 201`, answerText(answer.body));
  const value = record(bodyValue(answer.body));
  if (value && (value.print_started === true || value.print_queued === true)) return protocolError('an upload answer that started or queued a print');
  const item = record(value?.item);
  if (!item) return protocolError('an upload answer without an item');
  if (typeof item.path !== 'string' || item.path === '') return protocolError('an upload answer without item.path');
  if (item.root !== UPLOAD_ROOT) return protocolError('an upload answer outside the gcodes root', cleanText(String(item.root), 64));
  if (typeof item.size !== 'number' || !Number.isInteger(item.size) || item.size < 0) return protocolError('an upload answer without item.size');
  return { path: item.path, size: item.size };
}

/**
 * A JSON-RPC error (the `error` member, or the whole response) from the printer's WebSocket. The gateway's policy
 * refusal (-32001) is `denied`; Moonraker's errors carry an HTTP status as their code and read as parsePrinterAnswer
 * reads that status; anything else is `printer`, and something that is not an error object `protocol`.
 */
export function parseRpcError(error: unknown): PrinterError {
  const outer = record(error);
  const e = outer && 'error' in outer && 'jsonrpc' in outer ? record(outer.error) : outer;
  if (!e || typeof e.code !== 'number' || !Number.isInteger(e.code) || typeof e.message !== 'string') {
    return protocolError('a JSON-RPC error without a numeric code and a message');
  }
  const text = cleanText(e.message);
  if (e.code === RPC_POLICY_REFUSED) {
    const policy = fromPrinter(RPC_POLICY_REFUSED, text);
    return policy.kind === 'denied' ? policy : printerError('denied', "The gateway's policy refused the call", { status: e.code, detail: text });
  }
  return fromPrinter(e.code, text);
}

function nameOf(error: unknown): string {
  const e = record(error);
  return e && typeof e.name === 'string' ? e.name : '';
}

function messageOf(error: unknown): string {
  const e = record(error);
  return cleanText(e && typeof e.message === 'string' ? e.message : typeof error === 'string' ? error : '');
}

/**
 * A request that failed under fetch: an abort is `cancelled`, a timeout signal's `timeout`, and a network failure
 * (fetch's TypeError) `offline`, or `lost` once part of the body was sent (`sent` bytes). A small request reports no
 * bytes sent, so a request that changes the printer and is never sent twice (a print start, a queue entry) must pass
 * `committed`: it may have reached the printer, so its network failure is `lost` (the answer was lost), and the
 * caller re-reads the printer's state instead of taking it as not done.
 */
export function parseNetworkFailure(error: unknown, options: { sent?: number; committed?: boolean } = {}): PrinterError {
  const name = nameOf(error);
  if (name === 'AbortError') return cancelledError();
  if (name === 'TimeoutError') return printerError('timeout', 'The request timed out', { detail: messageOf(error) });
  if (options.sent) return printerError('lost', `The connection broke off after ${options.sent} bytes were sent`, { detail: messageOf(error) });
  if (options.committed) return printerError('lost', 'The answer was lost: the request may have reached the printer', { detail: messageOf(error) });
  return printerError('offline', 'The request failed on the network', { detail: messageOf(error) });
}

/** An XMLHttpRequest that ended with `error`, `abort` or `timeout`, `sent` bytes into its upload. */
export function parseXhrFailure(event: 'error' | 'abort' | 'timeout', sent: number): PrinterError {
  if (event === 'abort') return cancelledError();
  if (event === 'timeout') return printerError('timeout', 'The request timed out');
  return sent > 0 ? printerError('lost', `The upload broke off after ${sent} bytes`) : printerError('offline', 'The request failed on the network');
}

/** The status WebSocket closed when the client did not close it: `lost`. */
export function parseSocketClose(close: { code: number; reason?: string }): PrinterError {
  return printerError('lost', `The WebSocket closed (${close.code})`, { detail: cleanText(close.reason ?? '') });
}

/**
 * A close code of the relay connection. The binding reports every close as `refused` with its code, so the code says
 * which it was: unauthorised and expired are `refused` (a new grant may answer them, needsRegrant); revoked,
 * ALPN-refused, auth-failed, policy-denied and version-unsupported `refused` for good; at capacity `busy`; and any
 * other code (0 when the printer's endpoint closes for a restart or a reboot, device-shutdown, superseded,
 * device-unreachable, peer-gone, a code nobody knows) `lost`, which a reconnect may answer.
 */
export function parseCloseCode(code: number | bigint | string, detail = ''): PrinterError {
  const n = Number(code);
  const hex = Number.isInteger(n) && n >= 0 ? `0x${n.toString(16).padStart(4, '0')}` : String(code);
  const refusal = (Object.keys(CLOSE_CODES) as Refusal[]).find((r) => CLOSE_CODES[r] === n);
  if (refusal === 'rate-limited') return printerError('busy', 'The relay closed the connection: the printer is at capacity', { refusal, detail });
  if (refusal) return printerError('refused', `The relay refused the connection (${refusal})`, { refusal, detail });
  const refusing = REFUSING_CODES.get(n);
  if (refusing) return printerError('refused', `The relay refused the connection (${refusing}, ${hex})`, { detail });
  const ending = ENDING_CODES.get(n);
  return printerError('lost', `The connection was closed with code ${hex}${ending ? ` (${ending})` : ''}`, { detail });
}

/**
 * An error of the relay binding (muon-link-web: an Error with a `kind`): `refused` with its close code, which may be
 * an ordinary close (parseCloseCode); `lost` and `websocket`, a connection that broke off, are `lost`; `connect`,
 * `config`, `protocol` and anything else are `unreachable`. An abort is `cancelled`.
 */
export function parseBindingError(error: unknown): PrinterError {
  const e = record(error);
  const detail = messageOf(error);
  if (nameOf(error) === 'AbortError') return cancelledError();
  const kind = e && typeof e.kind === 'string' ? e.kind : '';
  if (kind === 'refused') {
    const code = e?.code;
    if (typeof code === 'number' || typeof code === 'bigint' || typeof code === 'string') return parseCloseCode(code, detail);
    return printerError('refused', 'The relay refused the connection', { detail });
  }
  if (kind === 'lost' || kind === 'websocket') return printerError('lost', `The relay connection broke off (${kind})`, { detail });
  return printerError('unreachable', `The relay connection could not be made${kind ? ` (${kind})` : ''}`, { detail });
}

/** Retry-After as seconds: a number of seconds, or an HTTP date (seconds from `now`). */
export function retryAfterSeconds(value: string | null | undefined, now = Date.now()): number | undefined {
  if (!value) return undefined;
  const text = value.trim();
  if (/^\d+$/.test(text)) return Number(text);
  const at = Date.parse(text);
  return Number.isNaN(at) ? undefined : Math.max(0, Math.ceil((at - now) / 1000));
}

/**
 * The account service's answer as an error, or null (2xx). 401 is `signed-out`; so is the token endpoint's
 * `invalid_grant` (`route: 'token'`). For a printer's access grant (`route: 'access'`) 503 means the printer is
 * offline and 504 that it did not answer the grant (`unreachable`). Anything else is `console`, with Retry-After.
 */
export function parseConsoleAnswer(answer: HttpAnswer, options: { route?: 'access' | 'token' } = {}): PrinterError | null {
  const { status } = answer;
  if (status >= 200 && status < 300) return null;
  const value = bodyValue(answer.body);
  const detail = answerText(value);
  if (status === 401) return printerError('signed-out', 'The account session has ended', { status, detail });
  if (options.route === 'token' && record(value)?.error === 'invalid_grant') {
    const description = record(value)?.error_description;
    return printerError('signed-out', 'The account service refused the grant (invalid_grant)', { status, detail: typeof description === 'string' ? cleanText(description) : '' });
  }
  if (options.route === 'access' && status === 503) return printerError('offline', 'The account service says the printer is offline', { status, detail });
  if (options.route === 'access' && status === 504) return printerError('unreachable', 'The printer did not answer the access grant', { status, detail });
  return printerError('console', `The account service answered ${status}`, { status, detail, retryAfterS: retryAfterSeconds(answer.retryAfter) });
}

/**
 * A request to the account service that failed under fetch. A refresh (`refreshing`) that failed in any way, an abort
 * included, has an unknown outcome and is `signed-out`: its token may have been used and is never sent twice.
 * Otherwise an abort is `cancelled`, and anything else `console`.
 */
export function parseConsoleFailure(error: unknown, options: { refreshing?: boolean } = {}): PrinterError {
  const detail = messageOf(error);
  if (options.refreshing) return printerError('signed-out', "The session's refresh has an unknown outcome", { detail });
  if (nameOf(error) === 'AbortError') return cancelledError();
  return printerError('console', 'The account service could not be reached', { detail });
}

/** A printer in the account service's list: `offline` when it says so, else null. */
export function parseConsolePrinter(entry: { online?: unknown }): PrinterError | null {
  return entry.online === false ? printerError('offline', 'The account service lists the printer as offline') : null;
}

/**
 * The `error` of a bridge failure from a host. The host is not trusted: a kind this package does not know, or no
 * message, is `protocol`; the host's message becomes `detail`, cleaned, and its action is cut to 64 characters.
 */
export function parseBridgeError(error: unknown): PrinterError {
  const e = record(error);
  if (!e || typeof e.message !== 'string') return protocolError('a bridge failure without a message');
  if (!isErrorKind(e.kind)) return protocolError('a bridge failure of an unknown kind', cleanText(String(e.kind), 64));
  const status = typeof e.status === 'number' && Number.isInteger(e.status) ? e.status : undefined;
  const action = typeof e.action === 'string' ? cleanText(e.action, 64) || undefined : undefined;
  return printerError(e.kind, `The host answered ${e.kind}`, { status, action, detail: cleanText(e.message) });
}

/**
 * A limit the client keeps ran out. Making the connection (`connect`) or probing it (`probe`) is `unreachable`;
 * waiting for an answer (`answer`) is `timeout`.
 */
export function timeoutError(phase: 'connect' | 'probe' | 'answer', seconds: number): PrinterError {
  if (phase === 'answer') return printerError('timeout', `No answer within ${seconds} s`);
  return printerError('unreachable', `The ${phase === 'connect' ? 'connection' : 'probe'} took longer than ${seconds} s`);
}

/** The client cancelled (an AbortSignal, the bridge's `cancel`). */
export function cancelledError(): PrinterError {
  return printerError('cancelled', 'Cancelled');
}

/** The host selected another printer while a request for this one was running. */
export function printerChangedError(): PrinterError {
  return printerError('printer-changed', 'The host selected another printer');
}

/** An answer that is not what the protocol says. */
export function protocolError(what: string, detail = ''): PrinterError {
  return printerError('protocol', `Unexpected answer: ${what}`, { detail });
}
