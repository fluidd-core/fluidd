import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

/** Verify the same commit pin the slicer uses, and ship its notices. */
export function muonLinkWeb (): Plugin {
  const root = path.resolve(__dirname, '..')
  const lockBytes = readFileSync(path.join(root, 'muon-link-web.lock.json'))
  const lock = JSON.parse(lockBytes.toString()) as { commit: string, dir: string, files: Record<string, string> }
  const directory = path.join(root, 'src/services/muon-cloud/vendor/muon-link-web', lock.dir)
  return {
    name: 'muon-link-web-pin',
    buildStart () {
      if (!/^[a-f0-9]{40}$/.test(lock.commit) || lock.dir !== lock.commit.slice(0, 7)) this.error('Invalid muon-link-web commit pin')
      for (const [file, expected] of Object.entries(lock.files)) {
        const bytes = readFileSync(path.join(directory, file))
        if (createHash('sha256').update(bytes).digest('hex') !== expected) this.error(`muon-link-web pin mismatch: ${file}`)
      }
    },
    generateBundle () {
      for (const file of ['LICENSE', 'NOTICE', 'THIRD-PARTY-NOTICES.md', 'SOURCE.md']) {
        this.emitFile({ type: 'asset', fileName: `licenses/muon-link-web/${lock.dir}/${file}`, source: readFileSync(path.join(directory, file)) })
      }
      this.emitFile({ type: 'asset', fileName: 'licenses/muon-link-web/muon-link-web.lock.json', source: lockBytes })
    }
  }
}
