// SPDX-License-Identifier: Apache-2.0
// Vendored from @muon3d/printer-client 0.4.0 (src/multipart/names.ts), Copyright 2026 Muon 3D
// Technologies Limited, under the Apache License 2.0 (vendor/printer-client/LICENSE and NOTICE). Changed for
// Fluidd by tools/vendor-printer-client.cjs: relative imports without ".ts"; Object.hasOwn as hasOwnProperty.call.
// The safe-name rule: which names a client may give a file it uploads to the printer's gcodes root. It is the
// gateway's file-name rule (checkUpload) and a little more, so a name that passes here passes the gateway on every
// route and is the name Moonraker stores the file under: Moonraker strips white space from the ends of the name and
// turns a .ufp upload into a .gcode file, so a name it would change is refused, and the name a client checked (that
// no file of that name is queued or loaded) is the name that is written. A host can check a name it is handed (a file
// to upload, a file whose metadata is asked for) before it builds a body with it; in a URL the name is still
// percent-encoded (it may hold &, ?, # or %).

/** The longest name, in UTF-8 bytes, a file on the printer may have (Linux's NAME_MAX). */
export const MAX_NAME_BYTES = 255;

// C0 controls, DEL and C1 controls.
const CONTROL_RE = /[\u0000-\u001f\u007f-\u009f]/;
// A UTF-16 surrogate without its pair: it has no UTF-8 encoding, so the name would arrive changed.
const LONE_SURROGATE_RE = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/;

/**
 * Why `name` cannot be the name of a file uploaded to the printer, or null when it can. Refused: an empty or blank
 * name, white space at either end, "." and "..", a slash or backslash (the file goes in the root, never in a folder),
 * a double quote or a semicolon (the name is written into the part's Content-Disposition, which the gateway splits at
 * semicolons and reads as a quoted string), a control character, a lone surrogate, more than 255 bytes, and a .ufp
 * name (stored as .gcode).
 */
export function unsafeNameReason(name: string): string | null {
  if (typeof name !== 'string' || name.trim() === '') return 'the name is empty';
  // trim() takes the white space Python's str.strip() does (but for its control characters, refused below), and
  // U+FEFF besides.
  if (name !== name.trim()) return 'the name starts or ends with white space';
  if (name === '.' || name === '..') return `"${name}" is not a file name`;
  if (name.includes('/') || name.includes('\\')) return 'the name contains a slash or backslash';
  if (name.includes('"')) return 'the name contains a double quote';
  if (name.includes(';')) return 'the name contains a semicolon';
  if (CONTROL_RE.test(name)) return 'the name contains a control character';
  if (LONE_SURROGATE_RE.test(name)) return 'the name is not valid Unicode';
  if (new TextEncoder().encode(name).byteLength > MAX_NAME_BYTES) return `the name is longer than ${MAX_NAME_BYTES} bytes`;
  if (/\.ufp$/i.test(name)) return 'the name ends in .ufp (the printer would store it as .gcode)';
  return null;
}

/** Whether `name` passes the safe-name rule (unsafeNameReason). */
export function isSafeName(name: string): boolean {
  return unsafeNameReason(name) === null;
}
