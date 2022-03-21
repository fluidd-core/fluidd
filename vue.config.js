/* eslint-disable @typescript-eslint/no-var-requires */
const MonacoEditorPlugin = require('monaco-editor-webpack-plugin')
const GenerateFilePlugin = require('generate-file-webpack-plugin')
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const { defineConfig } = require('@vue/cli-service')

const v = require('./package.json').version
const h = require('child_process')
  .execSync('git rev-parse --short HEAD')
  .toString()

module.exports = defineConfig({
  pluginOptions: {
    i18n: {
      locale: 'en',
      fallbackLocale: 'en',
      localeDir: 'locales',
      enabbleInSFC: false
    }
  },
  pwa: {
    themeColor: '#2196F3',
    msTileColor: '#000000',
    appleMobileWebAppCache: 'yes',
    manifestOptions: {
      start_url: '/',
      background_color: '#000000'
    }
  },
  transpileDependencies: [
    'vuetify'
  ],
  configureWebpack: {
    devtool: 'source-map',
    resolve: {
      fallback: {
        path: require.resolve('path-browserify')
      },
      symlinks: false // Don't follow symlinks, fixes issues when using npm link.
    },
    plugins: [
      new MonacoEditorPlugin({
        languages: ['markdown'],
        features: [
          '!codeAction',
          '!codelens',
          '!colorPicker',
          '!contextmenu',
          '!folding',
          '!hover',
          '!gotoError',
          '!gotoLine',
          '!gotoSymbol',
          '!quickCommand',
          '!quickHelp',
          '!referenceSearch',
          '!snippet'
        ]
      }),
      new GenerateFilePlugin({
        file: '.version',
        content: 'v' + v + '\n'
      })
      // new BundleAnalyzerPlugin({
      //   analyzerMode:
      //     (process.env.NODE_ENV === 'production') ? 'server' : 'disabled'
      // })
    ]
  },
  chainWebpack: config => {
    config.resolve.extensions
      .add('.yml')
      .add('yaml')
    config.module
      // Allows us to load yaml and have it loaded as json for locales.
      .rule('yaml-loader')
      .test(/.\.yaml$/)
      .use('json-loader')
      .loader('json-loader')
      .end()
      .use('yaml-loader')
      .loader('yaml-loader')
      .end()
    config.module
      // Loads the onigasm web assembly file directly
      .rule('wasm-loader')
      .test(/.\.wasm$/)
      .type('javascript/auto')
      .use('file-loader')
      .loader('file-loader')
      .end()
    config
      .plugin('define')
      .tap(args => {
        args[0]['process.env'].VERSION = JSON.stringify(v)
        args[0]['process.env'].HASH = JSON.stringify(h)
        return args
      })
  }
})
