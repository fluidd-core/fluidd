import { Plugin } from 'vite'
import { version } from '../../package.json'
import ChildProcess from 'child_process'

const vitePluginInjectVersion = (): Plugin => {
  return {
    name: 'version',
    config: () => {
      const git_hash = ChildProcess
        .execSync('git rev-parse --short HEAD')
        .toString()

      return {
        define: {
          'import.meta.env.VERSION': JSON.stringify(version),
          'import.meta.env.HASH': JSON.stringify(git_hash)
        }
      }
    }
  }
}

export default vitePluginInjectVersion
