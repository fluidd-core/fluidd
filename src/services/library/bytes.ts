/**
 * The Library's bytes: G-code is stored gzip-compressed (it shrinks to a
 * fifth or less), and every stored file is named by its SHA-256, which the
 * model service uses to skip files the account already holds.
 *
 * gzip runs through the browser's CompressionStream and DecompressionStream.
 * SHA-256 runs through crypto.subtle where the page has it; a page served by
 * the printer over plain http is not a secure context and has no
 * crypto.subtle, so there the hash is computed here (sha256Bytes).
 */

/** Runs `bytes` through a transform stream and collects what comes out. */
async function through (bytes: Uint8Array, transform: { readable: ReadableStream<Uint8Array>, writable: WritableStream<Uint8Array> }): Promise<Uint8Array> {
  const source = new ReadableStream<Uint8Array>({
    start (controller) {
      controller.enqueue(bytes)
      controller.close()
    }
  })
  const reader = source.pipeThrough(transform).getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    length += value.byteLength
  }
  const out = new Uint8Array(length)
  let at = 0
  for (const chunk of chunks) {
    out.set(chunk, at)
    at += chunk.byteLength
  }
  return out
}

export function gzip (bytes: Uint8Array): Promise<Uint8Array> {
  return through(bytes, new CompressionStream('gzip') as unknown as { readable: ReadableStream<Uint8Array>, writable: WritableStream<Uint8Array> })
}

export function gunzip (bytes: Uint8Array): Promise<Uint8Array> {
  return through(bytes, new DecompressionStream('gzip') as unknown as { readable: ReadableStream<Uint8Array>, writable: WritableStream<Uint8Array> })
}

/** Whether `bytes` start as a gzip stream does (1f 8b). */
export function isGzip (bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b
}

export function toHex (bytes: Uint8Array): string {
  let hex = ''
  for (const b of bytes) hex += b.toString(16).padStart(2, '0')
  return hex
}

/** The SHA-256 of `bytes` as 64 lowercase hex digits: crypto.subtle's where there is one. */
export async function sha256Hex (bytes: Uint8Array, subtle: SubtleCrypto | null = globalThis.crypto?.subtle ?? null): Promise<string> {
  if (subtle) return toHex(new Uint8Array(await subtle.digest('SHA-256', bytes)))
  return toHex(sha256Bytes(bytes))
}

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
])

const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n))

/** SHA-256 (FIPS 180-4) in plain JavaScript, for a page without crypto.subtle. */
export function sha256Bytes (bytes: Uint8Array): Uint8Array {
  const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19])
  const blocks = Math.ceil((bytes.length + 9) / 64)
  const padded = new Uint8Array(blocks * 64)
  padded.set(bytes)
  padded[bytes.length] = 0x80
  const view = new DataView(padded.buffer)
  const bits = bytes.length * 8
  view.setUint32(padded.length - 8, Math.floor(bits / 0x100000000))
  view.setUint32(padded.length - 4, bits >>> 0)
  const w = new Uint32Array(64)
  for (let block = 0; block < blocks; block++) {
    for (let t = 0; t < 16; t++) w[t] = view.getUint32(block * 64 + t * 4)
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3)
      const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10)
      w[t] = w[t - 16] + s0 + w[t - 7] + s1
    }
    let [a, b, c, d, e, f, g, hh] = h
    for (let t = 0; t < 64; t++) {
      const t1 = (hh + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[t] + w[t]) | 0
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0
      hh = g
      g = f
      f = e
      e = (d + t1) | 0
      d = c
      c = b
      b = a
      a = (t1 + t2) | 0
    }
    h[0] += a
    h[1] += b
    h[2] += c
    h[3] += d
    h[4] += e
    h[5] += f
    h[6] += g
    h[7] += hh
  }
  const out = new Uint8Array(32)
  const outView = new DataView(out.buffer)
  for (let i = 0; i < 8; i++) outView.setUint32(i * 4, h[i])
  return out
}
