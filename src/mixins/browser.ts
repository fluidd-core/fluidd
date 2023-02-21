import Vue from 'vue'
import { Component } from 'vue-property-decorator'

@Component
export default class BrowserMixin extends Vue {
  get isMobileViewport () {
    return this.$vuetify.breakpoint.mobile
  }

  get isMobileUserAgent () {
    const mobileUARegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i

    return (navigator as any).userAgentData?.mobile ?? mobileUARegex.test(navigator.userAgent)
  }
}
