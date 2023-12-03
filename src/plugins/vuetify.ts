import { Icons } from '@/globals'
import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import { Ripple } from 'vuetify/lib/directives'
import colors from 'vuetify/lib/util/colors'

Vue.use(Vuetify, {
  directives: { Ripple }
})

export default new Vuetify({
  breakpoint: {
    mobileBreakpoint: 'xs'
  },
  icons: {
    iconfont: 'mdiSvg',
    values: Icons
  },
  theme: {
    dark: true,
    options: {
      customProperties: true
    },
    themes: {
      dark: {
        primary: colors.blue.base,
        'primary-offset': colors.blue.base,
        secondary: '#888888', // colors.grey.darken1,
        'card-heading': '#333337',
        btncolor: '#4A4A4F',
        drawer: '#28282B',
        appbar: '#1E1E20',
        logo: colors.blue.base
      },
      light: {
        primary: colors.blue.darken2,
        'primary-offset': colors.blue.darken2,
        secondary: colors.grey.lighten1,
        'card-heading': '#E9E9E9',
        btncolor: '#E9E9E9',
        drawer: '#F4F4F4',
        appbar: '#FFFFFF',
        logo: colors.blue.darken2
      }
    }
  }
})
