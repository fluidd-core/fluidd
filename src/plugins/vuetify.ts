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
        'card-heading': '#333337',
        btncolor: '#4A4A4F'
      },
      light: {
        primary: colors.blue.darken2,
        'card-heading': '#dbdbdb',
        btncolor: '#ccc'
      }
    }
  }
})
