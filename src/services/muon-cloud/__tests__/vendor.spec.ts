import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'

it('ships the exact client and notices pinned by commit in the lockfile', async () => {
  const lock = JSON.parse(readFileSync(resolve('muon-link-web.lock.json'), 'utf8'))
  expect(lock.commit).toMatch(/^[a-f0-9]{40}$/)
  expect(lock.dir).toBe(lock.commit.slice(0, 7))
  for (const [file, hash] of Object.entries(lock.files)) {
    const bytes = readFileSync(resolve(`src/services/muon-cloud/vendor/muon-link-web/${lock.dir}/${file}`))
    expect(createHash('sha256').update(bytes).digest('hex'), file).toBe(hash)
  }
  const wasm = await WebAssembly.compile(readFileSync(resolve(`src/services/muon-cloud/vendor/muon-link-web/${lock.dir}/muon_link_web_bg.wasm`)))
  const exports = WebAssembly.Module.exports(wasm).map(e => e.name)
  // Existing Fluidd routes use browser Bluetooth as well as Iroh over relay.
  expect(exports).toContain('muonendpoint_addLink')
})
