import _Vue from 'vue'
import Axios, { AxiosResponse, AxiosStatic } from 'axios'
import { EventBus, FlashMessageTypes } from '@/eventBus'

export function AxiosPlugin<AxiosPlugOptions> (Vue: typeof _Vue): void {
  const responseInterceptor = (response: AxiosResponse) => {
    switch (response.status) {
      case 200:
        // Works!
        break
      default:
    }
    return response
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const errorInterceptor = (error: any) => {
    // Check if its a network / server error.
    if (!error.response) {
      // Network / Server Error.
      console.error('Network error')
      return Promise.reject(error)
    }

    // All other errors
    let message: string | undefined
    if (error.response.data) message = error.response.data
    switch (error.response.status) {
      case 400:
        console.error(error.response.status, error.message, message)
        EventBus.$emit(message || 'Server error', FlashMessageTypes.error, 5000)
        break
      default:
        console.error(error.response.status, error.message)
        EventBus.$emit(message || 'Server error', FlashMessageTypes.error, -1)
    }

    return Promise.reject(error)
  }

  Axios.interceptors.response.use(responseInterceptor, errorInterceptor)

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
