<template>
  <m3-dialog
    :value="value"
    title="Confirm it's you"
    :eyebrow="eyebrow"
    :tone="danger ? 'danger' : ''"
    :persistent="busy"
    max-width="440"
    data-tid="reauth-dialog"
    @close="cancel"
  >
    <p class="m3-dlg__text">
      {{ why }}
    </p>
    <p
      v-if="hasPasskey"
      class="m3-dlg__note"
    >
      Passkey confirmation: Coming soon. You can still use a fresh sign-in with a passkey.
    </p>
    <template v-if="hasPassword">
      <label class="m3-field">
        <span class="m3-field__label">Password</span>
        <span class="m3-field__box">
          <input
            ref="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            aria-label="Password"
            data-tid="reauth-password"
            @keydown.enter="submit"
          >
        </span>
      </label>
      <label
        v-if="twoStep"
        class="m3-field"
      >
        <span class="m3-field__label">Code from your authenticator app</span>
        <span class="m3-field__box m3-field__box--mono">
          <input
            v-model="code"
            inputmode="numeric"
            autocomplete="one-time-code"
            aria-label="Code from your authenticator app"
            data-tid="reauth-code"
            @keydown.enter="submit"
          >
        </span>
        <span class="m3-dlg__note">Or a recovery code.</span>
      </label>
    </template>
    <p
      v-else
      class="m3-dlg__text"
    >
      This account has no password. Sign out and sign in again, then do this within ten minutes.
    </p>
    <p
      v-if="error"
      class="m3-dlg__error"
      role="alert"
    >
      {{ error }}
    </p>
    <template #actions>
      <button
        type="button"
        class="cbtn cbtn--ghost"
        :disabled="busy"
        @click="cancel"
      >
        Cancel
      </button>
      <button
        v-if="hasPassword"
        type="button"
        class="cbtn"
        :class="danger ? 'cbtn--danger' : 'cbtn--primary'"
        :disabled="!ready || busy"
        data-tid="reauth-submit"
        @click="submit"
      >
        {{ action }}
      </button>
    </template>
  </m3-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import M3Dialog from '@/components/ui/M3Dialog.vue'
import type { Reauth } from '@/services/account/api'

/**
 * "Confirm it's you" (the canvas's delete step 2, for every sensitive
 * change): the password, and a code with two-step sign-in on. The console
 * asks for this when the last sign-in was more than ten minutes ago
 * (`403 reauth_required`). `submit` hands the answer to the parent, which
 * tries again and shows `error` if the console still refuses.
 */
@Component({ components: { M3Dialog } })
export default class ReauthDialog extends Vue {
  @Prop({ type: Boolean, required: true })
  readonly value!: boolean

  @Prop({ type: Boolean, default: true })
  readonly hasPassword!: boolean

  @Prop({ type: Boolean, default: false })
  readonly hasPasskey!: boolean

  @Prop({ type: Boolean, default: false })
  readonly twoStep!: boolean

  @Prop({ type: String, default: 'This needs a fresh sign-in, so someone at an unlocked computer can\'t do it.' })
  readonly why!: string

  @Prop({ type: String, default: 'Confirm' })
  readonly action!: string

  @Prop({ type: String, default: '' })
  readonly eyebrow!: string

  @Prop({ type: Boolean, default: false })
  readonly danger!: boolean

  @Prop({ type: Boolean, default: false })
  readonly busy!: boolean

  @Prop({ type: String, default: '' })
  readonly error!: string

  password = ''
  code = ''

  @Watch('value')
  onOpen (open: boolean) {
    if (open) {
      this.password = ''
      this.code = ''
    }
  }

  get ready (): boolean {
    return this.password.length > 0 && (!this.twoStep || this.code.trim().length > 0)
  }

  submit () {
    if (!this.ready || this.busy) return
    const answer: Reauth = { password: this.password }
    if (this.twoStep) answer.code = this.code.replace(/\s+/g, '')
    this.$emit('submit', answer)
  }

  cancel () {
    if (this.busy) return
    this.$emit('input', false)
    this.$emit('cancel')
  }
}
</script>
