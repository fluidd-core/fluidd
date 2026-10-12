// SPDX-License-Identifier: Apache-2.0
// Vendored from @muon3d/printer-client 0.2.0 (src/multipart/build.ts), Copyright 2026 Muon 3D
// Technologies Limited, under the Apache License 2.0 (vendor/printer-client/LICENSE and NOTICE). Changed for
// Fluidd by tools/vendor-printer-client.cjs: relative imports without ".ts"; Object.hasOwn as hasOwnProperty.call.
// The body of a G-code upload (POST /server/files/upload), built once. Every route sends these bytes: the printer's
// own origin, the relay (the gateway checks them strictly and rebuilds them, checkUpload), and a host that uploads
// for a framed client. Building the body by hand rather than from a FormData keeps the boundary the header names and
// the boundary the body uses the same: each serialisation of a FormData picks a new one, so taking the bytes from one
// and the Content-Type from another sends a body the gateway refuses.
//
// The body has exactly three parts, in this order: root = gcodes, checksum = the file's SHA-256 (Moonraker answers
// 422 when the file it wrote differs), and the file. Never `path` (the file goes in the root) and never `print`: a
// print is started by its own request, after the person confirmed it and the printer's checks passed.
import { encoder, indexOfBytes } from './bytes';
import { unsafeNameReason } from './names';

/** The only root a client uploads to (the gateway refuses any other for a remote session). */
export const UPLOAD_ROOT = 'gcodes';

/** A lowercase SHA-256 in hex: the form Moonraker compares the written file's digest in. */
export const CHECKSUM_RE = /^[0-9a-f]{64}$/;

export interface UploadFile {
  /** The file's name on the printer; it must pass the safe-name rule (names.ts). */
  name: string;
  bytes: Uint8Array | ArrayBuffer;
  /** The SHA-256 of `bytes`, lowercase hex. */
  checksum: string;
}

export interface UploadBody {
  /** `multipart/form-data; boundary=<boundary>`, the request's one Content-Type. */
  contentType: string;
  boundary: string;
  body: Uint8Array;
  /** The request's framing headers, Content-Type and Content-Length, for a route that sets headers itself. */
  headers: [string, string][];
}

/**
 * The boundary for a file: `muon3d-` and the first half of its checksum, so the same file always gets the same body.
 * A delimiter (CRLF, two dashes and the boundary) inside the file's bytes would end the file early; a file holding
 * its own digest's prefix is not a thing anyone can make, but if the bytes contain it all the same a counter is added
 * until they do not.
 */
export function boundaryFor(bytes: Uint8Array, checksum: string): string {
  const base = `muon3d-${checksum.slice(0, 32)}`;
  for (let n = 0; ; n++) {
    const boundary = n === 0 ? base : `${base}-${n}`;
    if (indexOfBytes(bytes, encoder.encode(`\r\n--${boundary}`)) < 0) return boundary;
  }
}

/**
 * The upload's multipart body: root, checksum and the file, each part with only the headers the gateway accepts,
 * CRLF line ends, no preamble, and one CRLF after the closing delimiter. Throws a RangeError when the name fails the
 * safe-name rule or the checksum is not a lowercase SHA-256.
 */
export function buildUploadBody(file: UploadFile): UploadBody {
  const reason = unsafeNameReason(file.name);
  if (reason) throw new RangeError(`Cannot upload "${file.name}": ${reason}.`);
  if (!CHECKSUM_RE.test(file.checksum)) throw new RangeError('The checksum must be a SHA-256 in lowercase hex.');
  const bytes = file.bytes instanceof Uint8Array ? file.bytes : new Uint8Array(file.bytes);
  const boundary = boundaryFor(bytes, file.checksum);
  const field = (name: string, value: string) => `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`;
  const head = encoder.encode(
    field('root', UPLOAD_ROOT) +
      field('checksum', file.checksum) +
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.name}"\r\nContent-Type: application/octet-stream\r\n\r\n`,
  );
  const tail = encoder.encode(`\r\n--${boundary}--\r\n`);
  const body = new Uint8Array(head.byteLength + bytes.byteLength + tail.byteLength);
  body.set(head, 0);
  body.set(bytes, head.byteLength);
  body.set(tail, head.byteLength + bytes.byteLength);
  const contentType = `multipart/form-data; boundary=${boundary}`;
  return { contentType, boundary, body, headers: [['Content-Type', contentType], ['Content-Length', String(body.byteLength)]] };
}
