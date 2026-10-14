import type { PluginObject, VueConstructor } from 'vue'
import type Vuetify from 'vuetify/lib'
import type VueI18n from 'vue-i18n'
import M3Confirm from '@/components/ui/M3Confirm.vue'

/**
 * What `$confirm` asks. `title` is the question, `message` (the first
 * argument) what will happen, and `buttonTrueText` the button that does it
 * ("Delete", "Restart"). `danger` makes that button red: for what can't be
 * undone or stops the printer. `color` and `icon` are vuetify-confirm's and
 * are ignored: the redesign's dialogs have neither.
 */
export interface ConfirmOptions {
  title?: string;
  eyebrow?: string;
  buttonTrueText?: string;
  buttonFalseText?: string;
  danger?: boolean;
  persistent?: boolean;
  width?: number;
  /** A print starts: the button stays off until the plate check is ticked. */
  plateCheck?: boolean;
  color?: string;
  icon?: string;
}

export type Confirm = (message: string, options?: ConfirmOptions) => Promise<boolean>

declare module 'vue/types/vue' {
  interface Vue {
    $confirm: Confirm;
  }
}

/**
 * `this.$confirm(message, options)`: the redesign's confirm dialog
 * (M3Confirm), in place of vuetify-confirm's. It resolves true for the
 * button that does it, and false for Cancel, ✕, Esc and a click outside.
 */
export const ConfirmPlugin: PluginObject<{ vuetify: Vuetify, i18n?: VueI18n }> = {
  install (Vue: VueConstructor, options) {
    const vuetify = options?.vuetify
    const i18n = options?.i18n

    const confirm: Confirm = (message, opts = {}) => new Promise<boolean>(resolve => {
      const props: ConfirmOptions = { ...opts }
      delete props.color
      delete props.icon
      const container = document.querySelector('[data-app=true]') || document.body
      const dialog = new M3Confirm({ vuetify, i18n, propsData: { ...props, message } })
      dialog.$on('result', (value: boolean) => {
        resolve(value)
        dialog.$destroy()
        dialog.$el.remove()
      })
      container.appendChild(dialog.$mount().$el)
    })

    Vue.prototype.$confirm = confirm
  }
}
