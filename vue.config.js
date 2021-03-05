/* eslint-disable @typescript-eslint/no-var-requires */
const GenerateFilePlugin = require('generate-file-webpack-plugin')
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

const v = require('./package.json').version
const h = require('child_process')
  .execSync('git rev-parse --short HEAD')
  .toString()

module.exports = {
  pwa: {
    themeColor: '#2196F3',
    msTileColor: '#000000',
    appleMobileWebAppCache: 'yes',
    manifestOptions: {
      background_color: '#000000'
    }
  },
  transpileDependencies: [
    'vuetify'
  ],
  configureWebpack: {
    resolve: {
      symlinks: false // Don't follow symlinks, fixes issues when using npm link.
    },
    plugins: [
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
    config
      .plugin('define')
      .tap(args => {
        args[0]['process.env'].VERSION = JSON.stringify(v)
        args[0]['process.env'].HASH = JSON.stringify(h)
        return args
      })
  }
}
