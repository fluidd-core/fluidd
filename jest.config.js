/* eslint-disable @typescript-eslint/no-var-requires */
process.env.TZ = 'GMT'

module.exports = {
  preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
  transformIgnorePatterns: [
    '@/node_modules/(?!lodash-es|dayjs)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^tests/(.*)$': '<rootDir>/tests/$1'
  },
  collectCoverageFrom: ['src/**/*.{ts,vue}', '!**/node_modules/**'],
  coverageReporters: ['html', 'text-summary'],
  setupFiles: [
    '<rootDir>/tests/unit/setup.ts'
  ],
  globals: {
    'ts-jest': {
      log: true
    }
  }
}
