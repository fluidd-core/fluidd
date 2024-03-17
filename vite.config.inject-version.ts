import child_process from 'child_process'
import fs from 'fs'
import path from 'path'
import { version } from './package.json'

import type { Plugin } from 'vite'

const writeVersionFile = async () => {
  const versionFile = await fs.promises.open(path.resolve(__dirname, 'dist/.version'), 'w')

  await versionFile.writeFile(`v${version}`)

  await versionFile.close()
}

const writeReleaseInfoFile = async () => {
  const releaseInfoFile = await fs.promises.open(path.resolve(__dirname, 'dist/release_info.json'), 'w')

  await releaseInfoFile.writeFile(JSON.stringify({
    project_name: 'fluidd',
    project_owner: 'fluidd-core',
    version: `v${version}`
  }))

  await releaseInfoFile.close()
}

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
        await writeVersionFile()
        await writeReleaseInfoFile()
      })
    }
  }
}

export default vitePluginInjectVersion
