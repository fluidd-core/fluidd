import { defineConfig } from 'oxfmt'

export default defineConfig({
  semi: false,
  singleQuote: true,
  printWidth: 100,
  trailingComma: 'none',
  arrowParens: 'avoid',
  ignorePatterns: [
    // Managed by Weblate
    'src/locales/**',
    // Auto-generated
    'components.d.ts',
    'CHANGELOG.md',
    'pnpm-lock.yaml',
    // Linted by markdownlint, with its own conventions
    'docs/**',
    '**/*.md'
  ],
  overrides: [
    {
      // Keeps the one-attribute-per-line template style eslint-plugin-vue used to enforce
      files: ['**/*.vue'],
      options: {
        singleAttributePerLine: true,
        htmlWhitespaceSensitivity: 'strict'
      }
    }
  ]
})
