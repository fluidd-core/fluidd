// Local verification only: CI's test setup, without device DNS or a shared HMR port.
import { defineConfig, mergeConfig } from 'vite'
import fluidd from './vite.config'
export default defineConfig(async env => mergeConfig(await (fluidd as any)({ ...env, command: 'build' }), {
  server: { hmr: false, host: '127.0.0.1' },
  test: { maxWorkers: 1, minWorkers: 1 }
}))
