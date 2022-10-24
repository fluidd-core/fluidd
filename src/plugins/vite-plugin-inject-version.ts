import child_process from 'child_process'
import fs from 'fs'
import path from 'path'
import { version } from '../../package.json'

import type { Plugin } from 'vite'

const vitePluginInjectVersion = (): Plugin => {
  return {
    name: 'version',
    config: () => {
      const git_hash = child_process
        .execSync('git rev-parse --short HEAD')
        .toString()

      return {
        define: {
          'import.meta.env.VERSION': JSON.stringify(version),
          'import.meta.env.HASH': JSON.stringify(git_hash)
        }
      }
    },
    writeBundle: () => {
      setImmediate(async () => {
        const versionFile = await fs.promises.open(path.resolve(__dirname, '../../dist/.version'), 'w')

        await versionFile.writeFile(`v${version}`)

        await versionFile.close()
      })
    }
  }
}

export default vitePluginInjectVersion
