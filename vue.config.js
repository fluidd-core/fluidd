/* eslint-disable @typescript-eslint/no-var-requires */
const { IgnorePlugin } = require('webpack')
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

module.exports = {
  transpileDependencies: [
    'vuetify'
  ],
  configureWebpack: {
    plugins: [
      // new ContextReplacementPlugin(/moment[/\\]locale$/, /de|fr|hu/), // Ignore specific locales.
      new IgnorePlugin(/^\.\/locale$/, /moment$/) // Ignore all moment locales.
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
    //   .set('plotly.js$', path.resolve(__dirname, 'node_modules/plotly.js/dist/plotly-basic.js'))

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
