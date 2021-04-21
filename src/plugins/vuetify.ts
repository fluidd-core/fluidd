import { Icons } from '@/globals'
import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import colors from 'vuetify/lib/util/colors'

Vue.use(Vuetify)

export default new Vuetify({
  breakpoint: {
    mobileBreakpoint: 'xs'
  },
  icons: {
    iconfont: 'mdiSvg',
    values: Icons
  },
  theme: {
    options: {
      customProperties: true
    },
    themes: {
      dark: {
        primary: colors.blue.base,
        secondary: colors.grey.darken1,
        'card-heading': '#333337',
        btncolor: '#4A4A4F'
      },
      light: {
        primary: colors.blue.darken2,
        secondary: colors.grey.lighten1,
        'card-heading': '#dbdbdb',
        btncolor: '#ccc'
      }
    }
  }
})
