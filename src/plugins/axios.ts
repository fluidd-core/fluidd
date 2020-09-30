import _Vue from 'vue'
import Axios, { AxiosStatic } from 'axios'

export function AxiosPlugin<AxiosPlugOptions> (Vue: typeof _Vue): void {
  // do stuff with options
  Vue.prototype.$http = Axios
  Vue.$http = Axios
}

export class AxiosPluginOptions {
  // add stuff
}

declare module 'vue/types/vue' {
  interface Vue {
    $http: AxiosStatic;
  }

  interface VueConstructor {
    $http: AxiosStatic;
  }
}
