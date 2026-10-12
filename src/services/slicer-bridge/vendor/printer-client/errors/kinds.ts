// SPDX-License-Identifier: Apache-2.0
// Vendored from @muon3d/printer-client 0.2.0 (src/errors/kinds.ts), Copyright 2026 Muon 3D
// Technologies Limited, under the Apache License 2.0 (vendor/printer-client/LICENSE and NOTICE). Changed for
// Fluidd by tools/vendor-printer-client.cjs: relative imports without ".ts"; Object.hasOwn as hasOwnProperty.call.
// The one error shape every route reports (the printer's own origin, the relay, a host over the bridge): a kind a
// client decides on, the printer's or the service's own words where it gave some, and the few facts a decision
// needs (the HTTP status, the access action refused, the relay's refusal, when to retry). The words a person reads
// are the client's: `message` is for logs, `detail` is the other side's text, cleaned for display.

export const ERROR_KINDS = [
  'offline', // the printer cannot be reached at all: no network answer, the console lists it offline
  'unreachable', // the connection could not be made: the binding's connect, config or protocol error, a timeout
  'lost', // a connection or a transfer that was working broke off, a close that refuses nothing, a lost answer
  'timeout', // an answer took longer than its limit
  'cancelled', // the client cancelled (an AbortSignal, the bridge's cancel)
  'refused', // the relay closed the connection with a code that refuses this key or session; see `refusal`
  'denied', // the printer or its gateway refused the request on a connection that stays open; see `action`
  'upload-refused', // the gateway's upload rules refused the body (400, 403, 411)
  'checksum', // the file the printer wrote is not the one sent (422)
  'safety-pass', // the printer's G-code safety pass refused the file (500)
  'busy', // the printer is printing a file of that name (403), or the relay is at capacity
  'printer', // any other error the printer answered with; `detail` is its message
  'signed-out', // the account's session has ended
  'console', // any other error of the account service
  'printer-changed', // over the bridge: the request named a printer the host no longer has selected
  'not-allowed', // over the bridge: the host does not allow the request
  'unsupported', // over the bridge: the host does not know the request
  'bad-request', // over the bridge: the request's parameters were refused
  'protocol', // an answer that is not what the protocol says
] as const;

export type ErrorKind = (typeof ERROR_KINDS)[number];

/** Why the relay closed a connection (its close codes, CLOSE_CODES). */
export type Refusal = 'unauthorised' | 'expired' | 'revoked' | 'rate-limited' | 'alpn-refused';

export interface PrinterError {
  kind: ErrorKind;
  /** What happened, in English, for logs. Not for display. */
  message: string;
  /** The HTTP status (or a JSON-RPC error's code) the answer carried. */
  status?: number;
  /** The access action the printer refused (`print`, `files`, …), from `access-denied:<action>`. */
  action?: string;
  refusal?: Refusal;
  /** The other side's own words (the printer's message, the gateway's reason), cleaned: one line, at most 500 characters. */
  detail?: string;
  /** When the service said to try again, in seconds (Retry-After). */
  retryAfterS?: number;
}

export function isErrorKind(value: unknown): value is ErrorKind {
  return typeof value === 'string' && (ERROR_KINDS as readonly string[]).includes(value);
}

/** A PrinterError, with the extra fields that have a value. */
export function printerError(kind: ErrorKind, message: string, extra: Omit<PrinterError, 'kind' | 'message'> = {}): PrinterError {
  const error: PrinterError = { kind, message };
  if (extra.status !== undefined) error.status = extra.status;
  if (extra.action !== undefined) error.action = extra.action;
  if (extra.refusal !== undefined) error.refusal = extra.refusal;
  if (extra.detail !== undefined && extra.detail !== '') error.detail = extra.detail;
  if (extra.retryAfterS !== undefined) error.retryAfterS = extra.retryAfterS;
  return error;
}

export function isPrinterError(value: unknown): value is PrinterError {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return isErrorKind(v.kind) && typeof v.message === 'string';
}

/**
 * Whether the connection may be tried again once with a new grant first: the relay refused it as unauthorised or
 * expired. A second refusal after the new grant is terminal; that count is the caller's.
 */
export function needsRegrant(error: PrinterError): boolean {
  return error.kind === 'refused' && (error.refusal === 'unauthorised' || error.refusal === 'expired');
}

/**
 * Whether nothing should reconnect or retry by itself after this error: a refusal by the relay (other than one a new
 * grant answers), a session that has ended, an answer that broke the protocol.
 */
export function isTerminal(error: PrinterError): boolean {
  if (error.kind === 'refused') return !needsRegrant(error);
  return error.kind === 'signed-out' || error.kind === 'protocol';
}

/** The longest `detail`, in characters. */
export const MAX_DETAIL = 500;

/**
 * Text from the other side, fit to show: control characters and runs of white space become one space, the marks and
 * overrides that turn the direction of the text around them are dropped, and it is trimmed and cut to `max`
 * characters (an ellipsis marks the cut).
 */
export function cleanText(text: string, max = MAX_DETAIL): string {
  const one = text
    .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '')
    .replace(/[\u0000-\u001f\u007f-\u009f\s]+/g, ' ')
    .trim();
  if (one.length <= max) return one;
  // Not between the two halves of a surrogate pair.
  const cut = /[\ud800-\udbff]/.test(one.charAt(max - 2)) ? max - 2 : max - 1;
  return `${one.slice(0, cut).trimEnd()}…`;
}
