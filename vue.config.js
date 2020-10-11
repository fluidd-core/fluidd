module.exports = {
  transpileDependencies: [
    'vuetify'
  ],
  chainWebpack: config => {
    config
      .plugin('define')
      .tap(args => {
        const v = JSON.stringify(require('./package.json').version)
        args[0]['process.env'].VERSION = v
        return args
      })
  }
}
