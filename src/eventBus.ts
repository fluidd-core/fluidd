import Vue from 'vue'

export const EventBus = {
  bus: new Vue(),
  $emit: (text?: string, options = {}): void => {
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

export interface FlashMessage {
  type?: FlashMessageTypes;
  open: boolean;
  text?: string;
  timeout?: number;
}

export enum FlashMessageTypes {
  success = 'success',
  error = 'error',
  warning = 'warning',
  primary = 'primary',
  secondary = 'secondary'
}
