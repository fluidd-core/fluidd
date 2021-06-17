import { Icons } from '@/globals'
import Vue from 'vue'
import Vuetify from 'vuetify'
import colors from 'vuetify/es5/util/colors'

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
        secondary: '#888888', // colors.grey.darken1,
        'card-heading': '#333337',
        btncolor: '#4A4A4F',
        drawer: '#28282B',
        appbar: '#1E1E20'
      },
      light: {
        primary: colors.blue.darken2,
        secondary: colors.grey.lighten1,
        'card-heading': '#E9E9E9',
        btncolor: '#E9E9E9',
        drawer: '#F4F4F4',
        appbar: '#FFFFFF'
      }
    }
  }
})
