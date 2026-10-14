module.exports = {
  root: true,
  // Apache-2.0 code copied from @muon3d/printer-client as it is (its own style):
  // tools/vendor-printer-client.cjs.
  ignorePatterns: ['src/services/slicer-bridge/vendor/**', 'src/services/m1-3d/vendor/*.js'],
  extends: [
    'plugin:vue/recommended',
    'eslint:recommended',
    '@vue/standard',
    '@vue/eslint-config-typescript/recommended'
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    camelcase: 'off',
    'getter-return': 'off',
    'no-use-before-define': 'off',
    'vue/no-v-html': 'off',
    'vue/no-v-text-v-html-on-component': 'off',
    '@typescript-eslint/no-explicit-any': 'off'
  },

  // 👇 add this
  overrides: [
    {
      files: ['src/aux_api/models/**/*.ts'],
      rules: {
        semi: 'off',
        '@typescript-eslint/semi': 'off'
      }
    }
  ]
}
