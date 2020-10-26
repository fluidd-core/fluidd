import { Icons } from '@/globals'
import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import colors from 'vuetify/lib/util/colors'

Vue.use(Vuetify)

export default new Vuetify({
  icons: {
    iconfont: 'mdiSvg',
    values: Icons
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
        primary: colors.blue.darken2,
        secondary: colors.grey.base,
        tertiary: '#ededed',
        quaternary: '#dbdbdb'
      }
    }
  }
})
