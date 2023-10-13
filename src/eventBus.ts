import Vue from 'vue'
import type { FlashMessage } from '@/types'

export const EventBus = {
  bus: new Vue(),
  $emit: (text?: string, options: Partial<FlashMessage> = {}): void => {
    const opts: FlashMessage = {
      open: true,
      timeout: -1,
      ...options
    }
    if (text) opts.text = text
    // if (type) opts.type = type
    // if (timeout) opts.timeout = timeout

    EventBus.bus.$emit('flashMessage', opts) // custom message
  }
}
