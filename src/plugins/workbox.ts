import _Vue from 'vue'
import wb from '@/registerServiceWorker'
import { Workbox } from 'workbox-window'

// This will require https in order to work properly.
export const WorkboxPlugin = {
  install (Vue: typeof _Vue) {
    Vue.prototype.$workbox = wb
    Vue.$workbox = wb
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $workbox: Workbox | null;
  }

  interface VueConstructor {
    $workbox: Workbox | null;
  }
}
