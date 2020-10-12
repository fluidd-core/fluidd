module.exports = {
  transpileDependencies: [
    'vuetify'
  ],
  chainWebpack: config => {
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
