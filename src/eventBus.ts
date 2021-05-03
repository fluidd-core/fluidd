import Vue from 'vue'
import { AppNotificationType } from '@/store/types'

export const EventBus = {
  bus: new Vue(),
  $emit: (text?: string, type?: AppNotificationType, timeout?: number): void => {
    const opts: FlashMessage = {
      open: true
    }
    if (text) opts.text = text
    if (type) opts.type = type
    if (timeout) opts.timeout = timeout

    EventBus.bus.$emit('flashMessage', opts) // custom message
  }
}

export interface FlashMessage {
  type?: AppNotificationType;
  open: boolean;
  text?: string;
  timeout?: number;
}
