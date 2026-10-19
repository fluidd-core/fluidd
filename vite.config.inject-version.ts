import child_process from 'child_process'
import fs from 'fs'
import path from 'path'
import { version } from './package.json'

import { loadEnv, type Plugin } from 'vite'

const fullCommit = () => {
  const fromEnvironment = process.env.FLUIDD_BUILD_COMMIT
  const commit = (fromEnvironment || child_process.execFileSync(
    'git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }
  )).trim()

  if (!/^[0-9a-f]{40}$/.test(commit)) {
    throw new Error('FLUIDD_BUILD_COMMIT must be a full, lowercase 40-character git SHA')
  }
  if (process.env.CI) {
    const dirty = child_process.execFileSync(
      'git', ['status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' }
    ).trimEnd()
    const unexpected = dirty.split('\n').filter(line => line && line.slice(3) !== 'components.d.ts')
    if (unexpected.length) throw new Error('Refusing to build from a dirty tree in CI')
  }
  return commit
}

const writeJson = (filename: string, value: unknown) => fs.promises.writeFile(
  path.resolve(__dirname, 'dist', filename),
  `${JSON.stringify(value, null, 2)}\n`
)

const vitePluginInjectVersion = (): Plugin => {
  const printerZipVerify = process.env.PRINTER_ZIP_VERIFY === '1'
  let commit = ''
  let buildTime = ''
  let cloudBaseUrl = ''

  return {
    name: 'version',
    config: (_, { mode }) => {
      commit = fullCommit()
      buildTime = new Date().toISOString()
      cloudBaseUrl = loadEnv(mode, __dirname, 'VUE_').VUE_MUON_CLOUD_URL || ''
      return {
        define: {
          'import.meta.env.VERSION': JSON.stringify(version),
          'import.meta.env.HASH': JSON.stringify(`${commit.slice(0, 7)}\n`)
        }
      }
    },
    transformIndexHtml: {
      order: 'pre',
      handler: () => {
        if (!printerZipVerify) return []
        return [{
          tag: 'meta',
          attrs: { name: 'fluidd-commit', content: commit },
          injectTo: 'head'
        }]
      }
    },
    async writeBundle () {
      await Promise.all([
        fs.promises.writeFile(path.resolve(__dirname, 'dist/.version'), `v${version}`),
        writeJson('release_info.json', {
          project_name: 'Muon3D_Fluidd',
          project_owner: 'Muon-3D',
          version: `v${version}`
        }),
        writeJson('build-info.json', {
          commit,
          buildTime,
          packageVersion: version,
          cloudBaseUrl
        })
      ])
    }
  }
}

export default vitePluginInjectVersion
