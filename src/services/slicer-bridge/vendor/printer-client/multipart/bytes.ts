// SPDX-License-Identifier: Apache-2.0
// Vendored from @muon3d/printer-client 0.3.0 (src/multipart/bytes.ts), Copyright 2026 Muon 3D
// Technologies Limited, under the Apache License 2.0 (vendor/printer-client/LICENSE and NOTICE). Changed for
// Fluidd by tools/vendor-printer-client.cjs: relative imports without ".ts"; Object.hasOwn as hasOwnProperty.call.
// Byte helpers the builder and the checker share.

export const encoder = new TextEncoder();

/** Where `needle` first occurs in `haystack` at or after `from`, or -1. */
export function indexOfBytes(haystack: Uint8Array, needle: Uint8Array, from = 0): number {
  const last = haystack.length - needle.length;
  for (let i = haystack.indexOf(needle[0], from); i !== -1 && i <= last; i = haystack.indexOf(needle[0], i + 1)) {
    let j = 1;
    while (j < needle.length && haystack[i + j] === needle[j]) j++;
    if (j === needle.length) return i;
  }
  return -1;
}

export const equalBytes = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((x, i) => x === b[i]);
