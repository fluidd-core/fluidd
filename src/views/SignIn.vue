<!--
  The console's sign-in page (WEB-12, muon-link-cloud#15).

  `/authorize` sends a browser with no console session here, with `continue`
  set to the `/authorize?...` it came from. This page signs the person in,
  turns that into the console's browser session with a handoff
  (`POST /v1/handoff`, then `GET /handoff?code=&next=`), and the console
  carries on to `continue`, which now finds a session and returns to the
  surface that asked.

  `continue` is followed only if it begins `/authorize?` (`safeContinue`).
  Anything else, or none, still signs in, and then asks `/authorize` itself
  for this page, so the person lands signed in to Fluidd.

  A passkey, a password (with the two-step code when the account has one),
  or a new account. The session made here exists only for the handoff, and
  is ended as soon as the handoff is in hand (KAN-532), so it never shows in
  the person's devices.
-->
<template>
  <div class="muon-sign-in">
    <v-card
      max-width="420"
      class="mx-auto pa-2"
    >
      <v-card-title class="pb-1">
        {{ title }}
      </v-card-title>
      <v-card-subtitle class="pt-1">
        {{ subtitle }}
      </v-card-subtitle>

      <v-card-text>
        <v-alert
          v-if="notice"
          type="info"
          dense
          text
          data-tid="sign-in-notice"
        >
          {{ notice }}
        </v-alert>

        <template v-if="mode === 'sign-in' && passkeys">
          <app-btn
            color="primary"
            block
            :loading="busy && passkeyBusy"
            :disabled="busy"
            data-tid="sign-in-passkey"
            @click="passkey"
          >
            Sign in with a passkey
          </app-btn>
          <div class="muon-sign-in__or">
            or
          </div>
        </template>

        <v-form
          v-if="mode !== 'sent'"
          ref="form"
          @submit.prevent="submit"
        >
          <template v-if="mode === 'code'">
            <v-text-field
              v-model="code"
              label="Code"
              inputmode="numeric"
              autocomplete="one-time-code"
              hint="Six digits from your authenticator app, or a recovery code."
              persistent-hint
              outlined
              dense
              autofocus
              data-tid="sign-in-code"
              class="mb-3"
            />
          </template>
          <template v-else>
            <v-text-field
              v-if="mode === 'sign-up'"
              v-model="name"
              label="Name"
              autocomplete="name"
              outlined
              dense
            />
            <v-text-field
              v-model="email"
              label="Email"
              type="email"
              autocomplete="email webauthn"
              outlined
              dense
              :autofocus="!passkeys"
              data-tid="sign-in-email"
            />
            <v-text-field
              v-if="mode !== 'forgot'"
              v-model="password"
              label="Password"
              :type="showPassword ? 'text' : 'password'"
              :autocomplete="mode === 'sign-in' ? 'current-password' : 'new-password'"
              :hint="mode === 'sign-up' ? 'At least 8 characters' : ''"
              outlined
              dense
              data-tid="sign-in-password"
            />
          </template>
          <v-alert
            v-if="error"
            type="error"
            dense
            text
            class="mb-3"
            data-tid="sign-in-error"
          >
            {{ error }}
          </v-alert>
          <app-btn
            type="submit"
            :color="mode === 'sign-in' && passkeys ? undefined : 'primary'"
            block
            :loading="busy && !passkeyBusy"
            :disabled="busy"
            data-tid="sign-in-submit"
          >
            {{ submitText }}
          </app-btn>
          <div
            v-if="mode === 'sign-in'"
            class="text-center mt-2"
          >
            <v-btn
              text
              small
              data-tid="sign-in-forgot"
              @click="setMode('forgot')"
            >
              Forgot your password?
            </v-btn>
          </div>
        </v-form>

        <p
          v-else
          class="mb-0"
          data-tid="sign-in-sent"
        >
          If there's an account for {{ email }}, we've sent it a link to choose a new password. It works once, for an hour.
        </p>
      </v-card-text>

      <v-card-actions class="justify-center pb-4">
        <template v-if="mode === 'sign-in' || mode === 'sign-up'">
          <span class="text-body-2 text--secondary">
            {{ mode === 'sign-in' ? 'New to Muon3D?' : 'Already have an account?' }}
          </span>
          <v-btn
            text
            small
            color="primary"
            @click="setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')"
          >
            {{ mode === 'sign-in' ? 'Create an account' : 'Sign in' }}
          </v-btn>
        </template>
        <v-btn
          v-else
          text
          small
          color="primary"
          data-tid="sign-in-back"
          @click="setMode('sign-in')"
        >
          Back to sign in
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { safeContinue } from '@/services/muon-cloud/centralLogin'
import { AccountError } from '@/services/account/client'
import { codeSignIn, finishSignIn, forgotPassword, passkeySignIn, passwordSignIn, signUp } from '@/services/account/sign-in'
import { cancelledPasskey, passkeysSupported } from '@/services/account/webauthn'

type Mode = 'sign-in' | 'sign-up' | 'code' | 'forgot' | 'sent'

@Component({})
export default class SignIn extends Vue {
  mode: Mode = 'sign-in'
  name = ''
  email = ''
  password = ''
  code = ''
  mfaToken = ''
  showPassword = false
  busy = false
  passkeyBusy = false
  error: string | null = null

  /** Where the console carries on after the handoff, if it is one it may. */
  get continuePath (): string | null {
    return safeContinue(this.$route.query.continue)
  }

  get notice (): string | null {
    if (this.$route.query.error === 'handoff_expired') return 'That sign-in took too long to finish. Sign in again.'
    return null
  }

  get passkeys (): boolean {
    return passkeysSupported()
  }

  get title (): string {
    switch (this.mode) {
      case 'sign-up': return 'Create your Muon3D account'
      case 'code': return 'Enter your code'
      case 'forgot': return 'Forgot your password?'
      case 'sent': return 'Check your email'
      default: return 'Sign in to Muon3D'
    }
  }

  get subtitle (): string {
    switch (this.mode) {
      case 'code': return 'This account has two-step sign-in.'
      case 'forgot': return 'We\'ll email you a link to choose a new one.'
      case 'sent': return ''
      default: return 'One account for your printers, the slicer and your models.'
    }
  }

  get submitText (): string {
    switch (this.mode) {
      case 'sign-up': return 'Create account'
      case 'code': return 'Continue'
      case 'forgot': return 'Send the link'
      default: return 'Sign in'
    }
  }

  setMode (mode: Mode) {
    this.mode = mode
    this.error = null
    if (mode !== 'code') {
      this.code = ''
      this.mfaToken = ''
    }
  }

  /** Overridable in tests: a full-page navigation. */
  go (url: string) {
    window.location.assign(url)
  }

  async passkey () {
    this.error = null
    this.busy = true
    this.passkeyBusy = true
    try {
      await this.finish(await passkeySignIn())
    } catch (error) {
      this.busy = false
      this.passkeyBusy = false
      if (!cancelledPasskey(error)) this.error = (error as Error).message
    }
  }

  async submit () {
    this.error = null
    this.busy = true
    try {
      switch (this.mode) {
        case 'forgot':
          await forgotPassword(this.email.trim())
          this.busy = false
          this.mode = 'sent'
          return
        case 'code':
          await this.finish(await codeSignIn(this.mfaToken, this.code))
          return
        case 'sign-up':
          await this.finish(await signUp(this.email.trim(), this.password, this.name.trim()))
          return
        default:
          await this.finish(await passwordSignIn(this.email.trim(), this.password))
      }
    } catch (error) {
      this.busy = false
      const mfa = error instanceof AccountError ? error.mfaToken : null
      if (mfa) {
        // The password was right; the code finishes it.
        this.password = ''
        this.mfaToken = mfa
        this.mode = 'code'
        return
      }
      this.error = (error as Error).message
    }
  }

  /** The handoff, then the page's own session ends, then on to the console. */
  async finish (token: string) {
    this.password = ''
    this.code = ''
    this.go(await finishSignIn(token, this.continuePath))
  }
}
</script>

<style lang="scss" scoped>
.muon-sign-in {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 16px;
}

.muon-sign-in__or {
  padding: 12px 0;
  color: var(--m3d-text-subtle);
  font-size: 12px;
  text-align: center;
}
</style>
