import pluginVue from 'eslint-plugin-vue'
import * as pluginRegexp from 'eslint-plugin-regexp'
import neostandard from 'neostandard'
import vueTsEslintConfig from '@vue/eslint-config-typescript'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: [
      'dist/**',
      'dev-dist/**',
      'docs/_site/**'
    ]
  },
  ...pluginVue.configs['flat/vue2-recommended'],
  pluginRegexp.configs['flat/recommended'],
  ...neostandard(),
  ...vueTsEslintConfig(),
  {
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      camelcase: 'off',
      'no-use-before-define': 'off',
      'vue/no-v-html': 'off',
      'vue/no-v-text-v-html-on-component': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off'
    }
  }
]
