import '@mdi/font/css/materialdesignicons.css'
import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import colors from 'vuetify/lib/util/colors'

Vue.use(Vuetify)

export default new Vuetify({
  icons: {
    iconfont: 'mdi'
  },
  theme: {
    themes: {
      dark: {
        primary: colors.blue.base,
        secondary: colors.grey.darken3,
        tertiary: '#262626',
        quaternary: '#333333'
      },
      light: {
        primary: colors.blue.base,
        secondary: colors.grey.lighten5,
        tertiary: '#ededed',
        quaternary: '#dbdbdb'
      }
    }
  }
})
