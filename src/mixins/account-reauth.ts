import { Component, Vue } from 'vue-property-decorator'
import type { Reauth } from '@/services/account/api'
import { AccountError } from '@/services/account/client'
import { accountState, describe } from '@/services/account/state'

export interface ReauthAsk {
  /** Why it's asked, in a line. */
  why?: string;
  /** The button: "Remove passkey". */
  action?: string;
  danger?: boolean;
}

interface ReauthDialogState extends Required<ReauthAsk> {
  open: boolean;
  busy: boolean;
  error: string;
}

/**
 * Runs a change that may need "Confirm it's you" (KAN-532): first with
 * nothing, since the console lets a sign-in of the last ten minutes through;
 * when it answers `reauth_required`, opens ReauthDialog and runs the change
 * again with the password (and code). The page puts
 * `<reauth-dialog v-bind="reauthProps" v-on="reauthOn" />` in its template.
 */
@Component
export default class AccountReauthMixin extends Vue {
  reauthState: ReauthDialogState = { open: false, busy: false, error: '', why: '', action: 'Confirm', danger: false }
  reauthSubmit: ((answer: Reauth) => void) | null = null
  reauthCancel: (() => void) | null = null

  get reauthProps () {
    const me = accountState.me
    return {
      value: this.reauthState.open,
      busy: this.reauthState.busy,
      error: this.reauthState.error,
      why: this.reauthState.why || undefined,
      action: this.reauthState.action,
      danger: this.reauthState.danger,
      hasPassword: me ? (me.sign_in?.password ?? me.account.has_password !== false) : true,
      hasPasskey: (me?.sign_in?.passkeys ?? 0) > 0,
      twoStep: me ? (me.sign_in?.two_step ?? me.account.two_step ?? false) : false
    }
  }

  get reauthOn () {
    return {
      submit: (answer: Reauth) => this.reauthSubmit?.(answer),
      cancel: () => this.reauthCancel?.(),
      input: (open: boolean) => { if (!open) this.reauthCancel?.() }
    }
  }

  /**
   * The change's result, or null when the person cancelled. Any error but a
   * `reauth_required` is thrown as it came.
   */
  async withReauth<T> (act: (answer: Reauth) => Promise<T>, ask: ReauthAsk = {}): Promise<T | null> {
    try {
      return await act({})
    } catch (error) {
      if (!(error instanceof AccountError && error.reauthRequired)) throw error
    }
    return new Promise<T | null>((resolve) => {
      this.reauthState = { open: true, busy: false, error: '', why: ask.why ?? '', action: ask.action ?? 'Confirm', danger: ask.danger ?? false }
      this.reauthSubmit = async (answer: Reauth) => {
        this.reauthState.busy = true
        this.reauthState.error = ''
        try {
          const result = await act(answer)
          this.reauthState.open = false
          resolve(result)
        } catch (error) {
          this.reauthState.error = describe(error)
        } finally {
          this.reauthState.busy = false
        }
      }
      this.reauthCancel = () => {
        this.reauthState.open = false
        resolve(null)
      }
    })
  }
}
