import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'

// ESLint only lints `.vue` files, for the template rules oxlint cannot run; everything else is
// linted by oxlint (`oxlint.config.ts`) and formatted by oxfmt (`oxfmt.config.ts`)

// Layout rules are formatting, which oxfmt owns
const vueLayoutRulesOff = Object.fromEntries(
  Object.entries(pluginVue.rules)
    .filter(([, rule]) => rule.meta?.type === 'layout')
    .map(([name]) => [`vue/${name}`, 'off'])
)

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.vue']
  },
  {
    name: 'app/files-to-ignore',
    ignores: ['**/*.{js,mjs,cjs,ts,mts,cts,tsx,jsx}', 'dist/**', 'dev-dist/**', 'docs/**']
  },
  pluginVue.configs['flat/vue2-recommended'],
  vueTsConfigs.base,
  {
    name: 'app/rules',
    rules: {
      ...vueLayoutRulesOff,
      // oxlint skips `no-unused-vars` in `.vue` files, as the template may use them
      '@typescript-eslint/no-unused-vars': 'error'
    }
  }
)
