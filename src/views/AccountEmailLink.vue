<template>
  <div
    class="acct-solo"
    data-tid="email-link-page"
  >
    <header class="acct-solo__top">
      <router-link
        to="/"
        aria-label="Muon3D home"
      >
        <span class="muon-wordmark">MUON3D</span>
      </router-link>
    </header>

    <main class="acct-solo__main">
      <div class="acct-solo__box lib-surface eml">
        <!-- Confirming an address, or finishing a change of it. -->
        <template v-if="kind === 'verify'">
          <h1>{{ verifyTitle }}</h1>
          <p
            v-if="state === 'working'"
            class="acct-muted"
          >
            One moment…
          </p>
          <p
            v-else-if="state === 'done'"
            class="acct-muted"
            data-tid="email-link-done"
          >
            {{ confirmed ? `${confirmed} is your Muon3D address now. Every security email goes there.` : 'Your address is confirmed.' }}
          </p>
          <p
            v-else
            class="acct-error"
            role="alert"
            data-tid="email-link-error"
          >
            {{ error }}
          </p>
        </template>

        <!-- Choosing a new password from the emailed link. -->
        <template v-else>
          <h1>{{ resetTitle }}</h1>
          <template v-if="state === 'ready' || state === 'working'">
            <p class="acct-muted">
              Setting it signs every device out, this one included. Your printers carry on as they are.
            </p>
            <form
              class="eml__form"
              @submit.prevent="reset"
            >
              <label class="acct-field">
                <span class="acct-field__label">New password</span>
                <span class="lib-field">
                  <input
                    v-model="password"
                    type="password"
                    autocomplete="new-password"
                    minlength="8"
                    aria-label="New password"
                    data-tid="email-link-password"
                  >
                </span>
                <span class="acct-field__note">At least 8 characters.</span>
              </label>
              <label class="acct-field">
                <span class="acct-field__label">The same again</span>
                <span class="lib-field">
                  <input
                    v-model="again"
                    type="password"
                    autocomplete="new-password"
                    aria-label="The same again"
                    data-tid="email-link-again"
                  >
                </span>
              </label>
              <p
                v-if="error"
                class="acct-error"
                role="alert"
                data-tid="email-link-error"
              >
                {{ error }}
              </p>
              <div class="acct-actions">
                <button
                  type="submit"
                  class="lib-btn lib-btn--pri"
                  :disabled="state === 'working' || !password"
                  data-tid="email-link-save"
                >
                  {{ state === 'working' ? 'Saving…' : 'Set password' }}
                </button>
              </div>
            </form>
          </template>
          <p
            v-else-if="state === 'failed'"
            class="acct-error"
            role="alert"
            data-tid="email-link-error"
          >
            {{ error }}
          </p>
          <p
            v-else
            class="acct-muted"
            data-tid="email-link-done"
          >
            Every device is signed out. Sign in again with your new password.
          </p>
        </template>

        <div
          v-if="state === 'done' || state === 'failed'"
          class="acct-actions"
        >
          <button
            v-if="kind === 'reset' || !signedIn"
            type="button"
            class="lib-btn lib-btn--pri"
            data-tid="email-link-sign-in"
            @click="signIn"
          >
            Sign in
          </button>
          <router-link
            v-else
            to="/account/security"
            class="lib-btn lib-btn--pri"
          >
            Your account
          </router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { cloudState } from '@/services/muon-cloud/state'
import { centralLoginEnabled, startCentralSignIn } from '@/services/muon-cloud/centralLogin'
import { describe } from '@/services/account/state'
import { resetPassword, verifyEmail } from '@/services/account/sign-in'
import '@/scss/muon3d-account.scss'

type Step = 'working' | 'ready' | 'done' | 'failed'

/**
 * The pages the console's emails link to (`/#/account/verify-email?token=`
 * and `/#/account/reset-password?token=`, which the router reads as paths):
 * confirming an address, and choosing a new password. The token is used
 * once, and leaves the address as soon as the page has it.
 */
@Component({})
export default class AccountEmailLink extends Vue {
  token = ''
  state: Step = 'ready'
  error = ''
  confirmed = ''
  password = ''
  again = ''

  get kind (): 'verify' | 'reset' {
    return this.$route.path.endsWith('/reset-password') ? 'reset' : 'verify'
  }

  get signedIn (): boolean {
    return cloudState.account !== null
  }

  get verifyTitle (): string {
    if (this.state === 'done') return 'Your email is confirmed'
    if (this.state === 'failed') return 'That link didn\'t work'
    return 'Confirming your email'
  }

  get resetTitle (): string {
    if (this.state === 'done') return 'Your password is changed'
    if (this.state === 'failed') return 'That link didn\'t work'
    return 'Choose a new password'
  }

  created () {
    const token = this.$route.query.token
    this.token = typeof token === 'string' ? token : ''
    // Out of the address, the history and any screenshot.
    if (this.token) this.$router.replace({ path: this.$route.path }).catch(() => {})
    if (!this.token) {
      this.fail('That link is incomplete. Open it again from the email.')
    } else if (this.kind === 'verify') {
      this.verify()
    }
  }

  fail (message: string) {
    this.error = message
    this.state = 'failed'
  }

  async verify () {
    this.state = 'working'
    try {
      this.confirmed = await verifyEmail(this.token)
      this.state = 'done'
    } catch (error) {
      this.fail(describe(error))
    }
  }

  async reset () {
    this.error = ''
    if (this.password.length < 8) {
      this.error = 'Use at least 8 characters.'
      return
    }
    if (this.password !== this.again) {
      this.error = 'The two passwords are different.'
      return
    }
    this.state = 'working'
    try {
      await resetPassword(this.token, this.password)
      this.password = ''
      this.again = ''
      // The console has signed every device out, this browser included.
      this.state = 'done'
    } catch (error) {
      this.error = describe(error)
      this.state = 'ready'
    }
  }

  signIn () {
    if (centralLoginEnabled()) startCentralSignIn({ silent: false, returnTo: '/account' }).catch(() => {})
    else this.$router.push('/').catch(() => {})
  }
}
</script>

<style lang="scss" scoped>
  .eml {
    gap: 14px;
    padding: 28px;

    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    p {
      margin: 0;
    }
  }

  .eml__form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
</style>
