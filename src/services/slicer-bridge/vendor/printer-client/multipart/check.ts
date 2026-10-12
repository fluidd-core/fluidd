// SPDX-License-Identifier: Apache-2.0
// Vendored from @muon3d/printer-client 0.2.0 (src/multipart/check.ts), Copyright 2026 Muon 3D
// Technologies Limited, under the Apache License 2.0 (vendor/printer-client/LICENSE and NOTICE). Changed for
// Fluidd by tools/vendor-printer-client.cjs: relative imports without ".ts"; Object.hasOwn as hasOwnProperty.call.
// A checker of the upload rules the printer's gateway applies to a remote POST /server/files/upload before it
// rebuilds the body for Moonraker: what it accepts, and the status it refuses the rest with (400 a body it will not
// read, 403 a destination a remote session may not write, 411 no length). The rules follow the gateway's own parser,
// muon-link's crates/muon-link-device/src/upload.rs (Apache-2.0, Muon 3D Technologies) at 33f14dc, and its request
// framing (http1.rs); bytes are compared as bytes, as there, so a byte order mark is never skipped.
// vectors/upload.json holds a case for each rule.
//
// - The request: exactly one Content-Type, `multipart/form-data` with a `boundary` parameter and no other; a boundary
//   of 1 to 70 characters, letters, digits and '()+_,-./:=? (it may be quoted); no Content-Encoding; a
//   Content-Length (none, or a lone `Transfer-Encoding: chunked`, is 411; Transfer-Encoding beside a Content-Length,
//   twice, or with another coding is a framing the gateway will not read, 400). The checker also holds the length to
//   the body it is given, which the gateway reads exactly that much of.
// - The body: no preamble (it opens with the first delimiter); CRLF line ends; after a delimiter CRLF (another part)
//   or "--" (the end); after the end nothing, or one CRLF.
// - A part: only Content-Disposition and an optional Content-Type, once each; a header block of at most 2048 bytes;
//   `form-data; name="…"`, with `; filename="…"` on the file only, the quoted strings holding no quote, backslash or
//   control character.
// - The parts: root, path, print, checksum and file, each at most once, and a file; any other part is 400. A root
//   other than gcodes, a path with a "." or ".." segment or a backslash, and a file name that is blank, "." or "..",
//   or has a slash, are 403 (a backslash in a file name is already 400: the quoted string may not hold one). A
//   field's value is at most 1024 bytes with no control character.
//
// checkPrintUpload adds what this package's clients promise on top: root = gcodes, a lowercase SHA-256 checksum, a
// file name that passes the safe-name rule, every field before the file, and never a `path` or `print`. The builder
// (build.ts) always passes both; a host checks a body it was handed with checkPrintUpload.
import { CHECKSUM_RE, UPLOAD_ROOT } from './build';
import { encoder, equalBytes, indexOfBytes } from './bytes';
import { unsafeNameReason } from './names';

/** A request as a client sends it: its headers (a name may repeat) and its whole body. */
export interface UploadRequest {
  headers: Iterable<readonly [string, string]> | Record<string, string>;
  body: Uint8Array;
}

/** The text fields Moonraker's upload reads, as the body carries them. */
export interface UploadFields {
  root?: string;
  path?: string;
  print?: string;
  checksum?: string;
}

export type UploadVerdict =
  | {
      ok: true;
      boundary: string;
      fields: UploadFields;
      file: { name: string; contentType: string | null; bytes: Uint8Array };
      /** The parts' names in body order, the file as "file". */
      order: string[];
    }
  | { ok: false; status: 400 | 403 | 411; reason: string };

/** The size limits, in bytes: a part's whole header block, and one field's value. */
export const MAX_PART_HEAD = 2048;
export const MAX_FIELD_VALUE = 1024;

const FIELDS = ['root', 'path', 'print', 'checksum'] as const;
type FieldName = (typeof FIELDS)[number];

const BOUNDARY_RE = /^[A-Za-z0-9'()+_,\-./:=?]{1,70}$/;
// ASCII controls (a byte or a character below 0x20, or 0x7f).
const ASCII_CONTROL_RE = /[\u0000-\u001f\u007f]/;
// Unicode's White_Space, which the gateway trims: JavaScript's trim() also takes U+FEFF and leaves U+0085.
const SPACE = '[\t\n\v\f\r \u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]';
const TRIM_RE = new RegExp(`^${SPACE}+|${SPACE}+$`, 'g');
const trim = (text: string) => text.replace(TRIM_RE, '');
const CRLF = new Uint8Array([13, 10]);
const HEAD_END = new Uint8Array([13, 10, 13, 10]);

// ignoreBOM keeps a leading byte order mark as U+FEFF: the gateway reads bytes, so a root of U+FEFF and "gcodes" is
// not gcodes, and a part header named U+FEFF and "Content-Disposition" is a header the gateway does not read.
const strictUtf8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
const lenientUtf8 = new TextDecoder('utf-8', { ignoreBOM: true });

class UploadRefusal extends Error {
  readonly status: 400 | 403 | 411;
  constructor(status: 400 | 403 | 411, reason: string) {
    super(reason);
    this.status = status;
  }
}
const malformed = (reason: string) => new UploadRefusal(400, reason);
const forbidden = (reason: string) => new UploadRefusal(403, reason);

function headerPairs(headers: UploadRequest['headers']): [string, string][] {
  const pairs = Symbol.iterator in headers ? Array.from(headers as Iterable<readonly [string, string]>) : Object.entries(headers as Record<string, string>);
  return pairs.map(([name, value]) => [String(name), String(value)]);
}

/** The boundary named by the request's headers (the framing rules first). */
function boundaryOf(headers: [string, string][], length: number): string {
  const named = (name: string) => headers.filter(([n]) => n.toLowerCase() === name).map(([, v]) => v);
  const codings = named('transfer-encoding');
  const lengths = named('content-length');
  if (codings.length) {
    // The framing comes first: only a lone chunked coding is a body the gateway reads, and then it wants a length.
    if (lengths.length || codings.length > 1 || trim(codings[0]).toLowerCase() !== 'chunked') {
      throw malformed('the request is ambiguously framed (Transfer-Encoding beside a Content-Length, twice, or not chunked)');
    }
    throw new UploadRefusal(411, 'a chunked upload has no length');
  }
  if (!lengths.length) throw new UploadRefusal(411, 'the upload has no Content-Length');
  if (lengths.length > 1 || !/^\d+$/.test(trim(lengths[0])) || Number(trim(lengths[0])) !== length) {
    throw malformed("the Content-Length is not the body's length");
  }
  const types = named('content-type');
  if (types.length !== 1) throw malformed('the upload must have exactly one Content-Type');
  if (named('content-encoding').length) throw malformed('the upload must not be content-encoded');
  const params = types[0].split(';').map(trim);
  if (params[0].toLowerCase() !== 'multipart/form-data') throw malformed('the upload is not multipart/form-data');
  if (params.length !== 2) throw malformed('the Content-Type must have a boundary and no other parameter');
  const eq = params[1].indexOf('=');
  if (eq < 0 || trim(params[1].slice(0, eq)).toLowerCase() !== 'boundary') throw malformed('the Content-Type has no boundary');
  let boundary = trim(params[1].slice(eq + 1));
  if (boundary.length >= 2 && boundary.startsWith('"') && boundary.endsWith('"')) boundary = boundary.slice(1, -1);
  if (!BOUNDARY_RE.test(boundary)) throw malformed('the boundary is not 1 to 70 of the allowed characters');
  return boundary;
}

/** What is between the quotes of `text`, or null when it is not quoted or holds a quote, backslash or control. */
function unquote(text: string): string | null {
  if (text.length < 2 || !text.startsWith('"') || !text.endsWith('"')) return null;
  const inner = text.slice(1, -1);
  return /["\\]/.test(inner) || ASCII_CONTROL_RE.test(inner) ? null : inner;
}

/** Whether a path or name has a "." or ".." segment, or a backslash. */
const hasDotSegment = (text: string) => text.includes('\\') || text.split('/').some((s) => s === '.' || s === '..');

type Part = { kind: 'field'; name: FieldName } | { kind: 'file'; filename: string; contentType: string | null };

function parsePartHead(bytes: Uint8Array): Part {
  let head: string;
  try {
    head = strictUtf8.decode(bytes);
  } catch {
    throw malformed("a part's headers are not UTF-8");
  }
  let disposition: string | null = null;
  let contentType: string | null | undefined;
  for (const line of head.split('\r\n')) {
    const colon = line.indexOf(':');
    const name = colon < 0 ? '' : line.slice(0, colon);
    const value = line.slice(colon + 1);
    if (!name || /[\t\n\f\r ]/.test(name) || /[\u0000-\u0008\u000a-\u001f\u007f]/.test(value)) throw malformed('a part has a malformed header');
    const lower = name.toLowerCase();
    if (lower === 'content-disposition') {
      if (disposition !== null) throw malformed('a part has two Content-Disposition headers');
      disposition = trim(value);
    } else if (lower === 'content-type') {
      if (contentType !== undefined) throw malformed('a part has two Content-Type headers');
      contentType = trim(value);
    } else {
      throw malformed(`a part has a ${name} header (only Content-Disposition and Content-Type are read)`);
    }
  }
  if (disposition === null) throw malformed('a part has no Content-Disposition');
  const params = disposition.split(';').map(trim);
  const name = params[1]?.startsWith('name=') ? unquote(params[1].slice(5)) : null;
  const filename = params[2] === undefined ? undefined : params[2].startsWith('filename=') ? unquote(params[2].slice(9)) : null;
  if (params[0].toLowerCase() !== 'form-data' || name === null || filename === null || params.length > 3) {
    throw malformed(`a part's Content-Disposition is not form-data; name="…" (and filename="…" on the file)`);
  }
  if (name === 'file' && filename !== undefined) {
    if (trim(filename) === '' || filename.includes('/') || hasDotSegment(filename)) {
      throw forbidden('the file name must be a plain name in the gcodes root');
    }
    return { kind: 'file', filename, contentType: contentType ?? null };
  }
  if (filename !== undefined) throw malformed(`the part "${name}" has a file name`);
  if (!(FIELDS as readonly string[]).includes(name)) throw malformed(`the part "${name}" is not one the upload reads`);
  return { kind: 'field', name: name as FieldName };
}

function check(request: UploadRequest): UploadVerdict {
  const body = request.body;
  const boundary = boundaryOf(headerPairs(request.headers), body.byteLength);
  const delimiter = encoder.encode(`\r\n--${boundary}`);
  const opening = delimiter.subarray(2);
  if (!equalBytes(body.subarray(0, opening.length), opening)) throw malformed('the body does not open with its boundary');
  let at = opening.length;

  // After a delimiter: CRLF starts another part (true), "--" ends the body (false).
  const next = () => {
    const two = body.subarray(at, at + 2);
    at += 2;
    if (equalBytes(two, CRLF)) return true;
    if (two.length === 2 && two[0] === 45 && two[1] === 45) return false;
    throw malformed('a boundary is followed by something other than CRLF or "--"');
  };
  // The bytes up to `needle` (consumed with it), at most `max` of them.
  const until = (needle: Uint8Array, max: number, what: string) => {
    const end = indexOfBytes(body, needle, at);
    if (end < 0) throw malformed(body.length - at > max + needle.length ? `${what} is too long` : `the body ends inside ${what}`);
    if (end - at > max) throw malformed(`${what} is too long`);
    const taken = body.subarray(at, end);
    at = end + needle.length;
    return taken;
  };

  const fields: UploadFields = {};
  const order: string[] = [];
  let file: { name: string; contentType: string | null; bytes: Uint8Array } | null = null;
  let more = next();
  if (!more) throw malformed('the upload has no file');
  while (more) {
    const part = parsePartHead(until(HEAD_END, MAX_PART_HEAD, "a part's headers"));
    if (part.kind === 'file') {
      if (file) throw malformed('the upload has two files');
      const end = indexOfBytes(body, delimiter, at);
      if (end < 0) throw malformed('the body ends inside the file');
      file = { name: part.filename, contentType: part.contentType, bytes: body.subarray(at, end) };
      at = end + delimiter.length;
      order.push('file');
    } else {
      const raw = until(delimiter, MAX_FIELD_VALUE, `the field "${part.name}"`);
      if (raw.some((b) => b < 0x20 || b === 0x7f)) throw malformed(`the field "${part.name}" contains a control character`);
      if (fields[part.name] !== undefined) throw malformed(`the field "${part.name}" is repeated`);
      let value: string;
      if (part.name === 'path') {
        try {
          value = strictUtf8.decode(raw);
        } catch {
          throw malformed('the path is not UTF-8');
        }
        if (hasDotSegment(value)) throw forbidden('the path may not leave the gcodes root');
      } else {
        value = lenientUtf8.decode(raw);
        if (part.name === 'root' && value !== UPLOAD_ROOT) throw forbidden('a remote upload goes to the gcodes root only');
      }
      fields[part.name] = value;
      order.push(part.name);
    }
    more = next();
    if (!more && !file) throw malformed('the upload has no file');
  }
  const rest = body.subarray(at);
  if (!(rest.length === 0 || equalBytes(rest, CRLF))) throw malformed('the body goes on after its closing boundary');
  return { ok: true, boundary, fields, file: file as NonNullable<typeof file>, order };
}

/**
 * What the gateway makes of an upload: accepted (with what it read), or refused with the status and a reason. Never
 * throws for a bad request.
 */
export function checkUpload(request: UploadRequest): UploadVerdict {
  try {
    return check(request);
  } catch (err) {
    if (err instanceof UploadRefusal) return { ok: false, status: err.status, reason: err.message };
    throw err;
  }
}

/**
 * checkUpload, and then the rules this package's clients keep: a root (gcodes) and a lowercase SHA-256 checksum, both
 * before the file; a file name that passes the safe-name rule; no `path` or `print` field. A body that breaks one of
 * them is refused with 400.
 */
export function checkPrintUpload(request: UploadRequest): UploadVerdict {
  const verdict = checkUpload(request);
  if (!verdict.ok) return verdict;
  const refuse = (reason: string): UploadVerdict => ({ ok: false, status: 400, reason });
  const { fields, file, order } = verdict;
  if (fields.print !== undefined) return refuse('the upload has a print field (a print is started on its own, after the confirmation)');
  if (fields.path !== undefined) return refuse('the upload has a path field (the file goes in the root)');
  if (fields.root === undefined) return refuse('the upload names no root');
  if (fields.checksum === undefined || !CHECKSUM_RE.test(fields.checksum)) return refuse('the upload has no lowercase SHA-256 checksum');
  if (order.indexOf('file') !== order.length - 1) return refuse('a field comes after the file');
  const unsafe = unsafeNameReason(file.name);
  if (unsafe) return refuse(unsafe);
  return verdict;
}
