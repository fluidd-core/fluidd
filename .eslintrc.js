module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },
  extends: [
    'plugin:vue/recommended',
    '@vue/standard',
    '@vue/typescript/recommended'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    sourceType: 'module'
  },
  plugins: [
    'vue'
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    camelcase: 'off',
    'no-use-before-define': 'off',
    'vue/no-v-html': 'off',
    'vue/no-v-text-v-html-on-component': 'off',
    '@typescript-eslint/no-explicit-any': 'off'
  }
}
