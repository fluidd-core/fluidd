import isUserAgentDataMobileSupported from '@/util/is-user-agent-data-mobile-supported'
import { Vue, Component } from 'vue-property-decorator'

@Component
export default class BrowserMixin extends Vue {
  get isMobileViewport (): boolean {
    return this.$vuetify.breakpoint.mobile
  }

  get isMobileUserAgent (): boolean {
    if (isUserAgentDataMobileSupported(navigator)) {
      return navigator.userAgentData.mobile
    }

    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      .test(navigator.userAgent)
  }
}
