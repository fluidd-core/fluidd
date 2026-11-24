import { defineConfig } from 'oxlint'
import pluginRegexp from 'eslint-plugin-regexp'

// Ported from the previous ESLint config (neostandard + typescript-eslint recommended +
// eslint-plugin-regexp): oxlint's `correctness` category covers most of it, the rules below are
// the rest. Stylistic rules are left to oxfmt, and `vue/*` rules to ESLint, as oxlint cannot parse
// templates
export default defineConfig({
  // Listing plugins replaces oxlint's defaults, so `unicorn` and `oxc` are named explicitly
  plugins: ['typescript', 'unicorn', 'oxc', 'node', 'promise', 'import'],
  jsPlugins: ['eslint-plugin-regexp'],
  categories: {
    correctness: 'error',
    suspicious: 'error',
    perf: 'error'
  },
  env: {
    builtin: true,
    browser: true,
    node: true,
    es2024: true
  },
  ignorePatterns: ['dist/**', 'dev-dist/**', 'docs/**', 'components.d.ts'],
  rules: {
    ...pluginRegexp.configs['flat/recommended'].rules,

    'accessor-pairs': 'error',
    'array-callback-return': 'error',
    curly: ['error', 'multi-line'],
    'default-case-last': 'error',
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    'new-cap': ['error', { capIsNew: false }],
    'no-array-constructor': 'error',
    'no-case-declarations': 'error',
    'no-constant-condition': ['error', { checkLoops: false }],
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-extend-native': 'error',
    'no-extra-bind': 'error',
    'no-fallthrough': 'error',
    'no-implied-eval': 'error',
    'no-labels': 'error',
    'no-lone-blocks': 'error',
    'no-multi-str': 'error',
    'no-new': 'error',
    'no-new-func': 'error',
    'no-new-wrappers': 'error',
    'no-object-constructor': 'error',
    'no-proto': 'error',
    'no-prototype-builtins': 'error',
    'no-return-assign': 'error',
    'no-self-compare': 'error',
    'no-sequences': 'error',
    'no-template-curly-in-string': 'error',
    'no-throw-literal': 'error',
    'no-unexpected-multiline': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-unneeded-ternary': ['error', { defaultAssignment: false }],
    'no-useless-call': 'error',
    'no-useless-computed-key': 'error',
    'no-useless-constructor': 'error',
    'no-useless-return': 'error',
    'no-var': 'error',
    'no-void': 'error',
    'object-shorthand': ['warn', 'properties'],
    'one-var': ['error', { initialized: 'never' }],
    'prefer-const': ['error', { destructuring: 'all' }],
    'prefer-promise-reject-errors': 'error',
    'prefer-regex-literals': ['error', { disallowRedundantWrapping: true }],
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',
    'symbol-description': 'error',
    'unicode-bom': 'error',
    'use-isnan': ['error', { enforceForIndexOf: true }],
    'valid-typeof': ['error', { requireStringLiterals: true }],
    yoda: 'error',

    // `suspicious` rules that only flag house style: Vuex getters take a `getters` argument
    // and callbacks reuse the outer name (`files.find(file => …)`); `_` marks unused and
    // private names
    'no-shadow': 'off',
    'no-underscore-dangle': 'off',
    // Stream reads, cancellable uploads and ordered database writes must run one at a time
    'no-await-in-loop': 'off',
    'no-promise-executor-return': 'error',
    radix: 'error',

    'node/handle-callback-err': ['error', '^(err|error)$'],
    'node/no-exports-assign': 'error',
    'node/no-new-require': 'error',
    'node/no-path-concat': 'error',

    'promise/param-names': 'error',

    // `toSorted()` and `toReversed()` are ES2023, beyond the ES2022 lib and Vite's targets
    'unicorn/no-array-reverse': 'off',
    'unicorn/no-array-sort': 'off',
    'unicorn/consistent-function-scoping': 'off',
    'unicorn/prefer-add-event-listener': 'off',
    // Flags worker and `MessagePort` `postMessage` calls, which take no target origin
    'unicorn/require-post-message-target-origin': 'off',
    // Vuex getters must return new objects rather than mutate state
    'oxc/no-map-spread': 'off',

    // Follows `@/` aliases and `.vue` imports; type-only and dynamic imports are not followed
    'import/no-cycle': 'error',
    // Misreads Vite's `?worker` imports; TypeScript already checks default imports
    'import/default': 'off',
    // `Vue.set`, `Vuex.Store` and `import consola from 'consola'` are how these libraries are
    // documented; side-effect imports (`import './setupConsola'`) are intentional
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off',
    'import/no-unassigned-import': 'off',

    'typescript/ban-ts-comment': 'error',
    'typescript/no-namespace': 'error',
    'typescript/no-require-imports': 'error',
    'typescript/no-unnecessary-type-constraint': 'error',
    'typescript/no-unsafe-function-type': 'error'
  },
  overrides: [
    {
      files: ['src/**/__tests__/**'],
      plugins: ['vitest'],
      rules: {
        // `expect` takes an optional message as its second argument
        'vitest/valid-expect': ['error', { maxArgs: 2 }],
        // Typing a `fetch` mock as `typeof fetch` would force casting every partial `Response`
        'vitest/require-mock-type-parameters': 'off',
        'vitest/require-to-throw-message': 'off'
      }
    }
  ]
})
