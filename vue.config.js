/* eslint-disable @typescript-eslint/no-var-requires */
const { IgnorePlugin } = require('webpack')
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

module.exports = {
  pwa: {
    themeColor: '#2196F3',
    msTileColor: '#000000',
    appleMobileWebAppCache: 'yes'
  },
  transpileDependencies: [
    'vuetify'
  ],
  configureWebpack: {
    resolve: {
      symlinks: false // Don't follow symlinks, fixes issues when using npm link.
    },
    plugins: [
      // new ContextReplacementPlugin(/moment[/\\]locale$/, /de|fr|hu/), // Ignore specific locales.
      new IgnorePlugin(/^\.\/locale$/, /moment$/) // Ignore all moment locales (comes from chartjs)
      // new BundleAnalyzerPlugin({
      //   analyzerMode:
      //     (process.env.NODE_ENV === 'production') ? 'server' : 'disabled'
      // })
    ]
  },
  chainWebpack: config => {
    // config
    //   .resolve
    //   .alias
    //   .set('plotly.js/dist/plotly', 'plotly.js/dist/plotly-basic.js')

    config
      .plugin('define')
      .tap(args => {
        const v = JSON.stringify(require('./package.json').version)
        const h = JSON.stringify(require('child_process')
          .execSync('git rev-parse --short HEAD')
          .toString())
        args[0]['process.env'].VERSION = v
        args[0]['process.env'].HASH = h
        return args
      })
  }
}
