<template>
  <div
    class="acct-solo"
    data-tid="signed-out-page"
  >
    <header class="acct-solo__top">
      <router-link
        to="/"
        aria-label="Muon3D home"
      >
        <span class="muon-wordmark">MUON3D</span>
      </router-link>
      <span class="acct-solo__links">
        <a
          class="lib-btn lib-btn--ghost"
          href="https://muon3d.com"
        >muon3d.com</a>
        <button
          type="button"
          class="lib-btn"
          data-tid="signed-out-sign-in"
          @click="signIn"
        >
          Sign in
        </button>
      </span>
    </header>

    <main class="acct-solo__main sgo">
      <div class="sgo__head">
        <span class="sgo__icon"><frame-icon
          name="check"
          large
        /></span>
        <h1>You're signed out</h1>
        <p data-tid="signed-out-line">
          {{ line }}
        </p>
        <span class="sgo__oks">
          <template v-if="note && note.scope === 'browser'">
            <span class="sgo__ok"><frame-icon
              name="check"
              small
            />Control</span>
            <span class="sgo__ok"><frame-icon
              name="check"
              small
            />Slice</span>
          </template>
          <span class="sgo__ok sgo__ok--quiet"><frame-icon
            name="check"
            small
          />No print was stopped</span>
        </span>
      </div>

      <section
        v-if="note && note.password && note.email"
        class="lib-surface sgo__card sgo__password"
        aria-label="Change your password"
        data-tid="signed-out-password"
      >
        <span class="lib-card-title">Change your password</span>
        <span class="acct-muted">We'll email {{ note.email }} a link to set a new one. Using it signs every device out again.</span>
        <button
          v-if="!resetSent"
          type="button"
          class="lib-btn lib-btn--pri"
          :disabled="busy"
          data-tid="signed-out-reset"
          @click="sendReset"
        >
          Email me a link
        </button>
        <span
          v-else
          class="acct-note acct-note--good"
          role="status"
        ><frame-icon
          name="mail"
          small
        />Sent. Open the link in the email to choose a new password.</span>
      </section>

      <div class="sgo__grid">
        <section
          class="lib-surface sgo__card"
          aria-label="Sign in again"
        >
          <span class="lib-card-title">Sign in again</span>
          <button
            v-if="passkeys"
            type="button"
            class="lib-btn lib-btn--lg lib-btn--pri sgo__wide"
            :disabled="busy"
            data-tid="signed-out-passkey"
            @click="passkey"
          >
            <frame-icon
              name="key"
              small
            />Sign in with a passkey
          </button>
          <button
            type="button"
            class="lib-btn lib-btn--lg sgo__wide"
            :class="{ 'lib-btn--pri': !passkeys }"
            :disabled="busy"
            data-tid="signed-out-password-sign-in"
            @click="signIn"
          >
            Email and password
          </button>
          <p
            v-if="error"
            class="acct-error"
            role="alert"
          >
            {{ error }}
          </p>
        </section>

        <section
          v-if="nearby.length"
          class="lib-surface sgo__card"
          aria-label="Printers on this network"
          data-tid="signed-out-nearby"
        >
          <span class="acct-card__title sgo__title">
            <span class="lib-card-title">On this network</span>
            <span class="acct-subtle">No account needed</span>
          </span>
          <div class="acct-list">
            <div
              v-for="printer in nearby"
              :key="printer.id"
              class="sgo__found"
            >
              <printer-thumb :size="44" />
              <span class="acct-row__label">
                <b>{{ printer.name }}</b>
                <span>{{ printer.host }}</span>
              </span>
              <a
                class="lib-btn lib-btn--sm"
                :href="`http://${printer.host}/`"
              >Open</a>
            </div>
          </div>
        </section>
      </div>

      <span class="sgo__foot">On a shared computer? Close this browser window as well.</span>
    </main>

    <cloud-account-dialog
      v-if="accountDialog"
      v-model="accountDialog"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import PrinterThumb from '@/components/ui/PrinterThumb.vue'
import { cloudApi } from '@/services/muon-cloud/api'
import { cloudState } from '@/services/muon-cloud/state'
import { centralLoginEnabled, startCentralSignIn } from '@/services/muon-cloud/centralLogin'
import { nearbyHost } from '@/services/muon-cloud/discovery'
import { describe } from '@/services/account/state'
import { finishSignIn, forgotPassword, passkeySignIn } from '@/services/account/sign-in'
import { cancelledPasskey, passkeysSupported } from '@/services/account/webauthn'
import { forgetSignedOut, readSignedOut, type SignedOutNote } from '@/services/account/signed-out-note'
import '@/scss/muon3d-account.scss'

/**
 * `/signed-out` (the canvas's "Signed out"): what was signed out, that no
 * print stopped, signing in again, and the printers on this network, which
 * open without an account. Signed in, it goes home.
 */
@Component({
  components: {
    PrinterThumb,
    CloudAccountDialog: () => import('@/components/muon-cloud/CloudAccountDialog.vue')
  }
})
export default class SignedOut extends Vue {
  note: SignedOutNote | null = null
  nearby: Array<{ id: string, name: string, host: string }> = []
  busy = false
  error = ''
  resetSent = false
  accountDialog = false

  created () {
    this.note = readSignedOut()
    forgetSignedOut()
    this.findNearby()
  }

  @Watch('signedIn', { immediate: true })
  onSignedIn () {
    if (this.signedIn) this.$router.replace('/').catch(() => {})
  }

  get signedIn (): boolean {
    return cloudState.ready && cloudState.account !== null
  }

  /** The console's page: passkeys belong to its name (muon3d.com). */
  get passkeys (): boolean {
    return centralLoginEnabled() && passkeysSupported()
  }

  get line (): string {
    const who = this.note?.email || 'You'
    const is = this.note?.email ? 'is' : 'are'
    switch (this.note?.scope) {
      case 'everywhere':
        return `${who} ${is} signed out everywhere: every browser, Slice and the Muon3D app.`
      case 'deleted':
        return 'Your account is being deleted, and you\'re signed out everywhere. Your printers keep working on your network, with no account.'
      case 'browser':
        return `${who} ${is} signed out of Control and Slice in this browser. Your other devices are still signed in.`
      default:
        return 'You\'re signed out of Muon3D in this browser.'
    }
  }

  async findNearby () {
    try {
      const { printers } = await cloudApi.nearby()
      this.nearby = printers
        .map(p => ({ id: p.printer_id, name: p.name, host: nearbyHost(p.local_addrs ?? []) ?? '' }))
        .filter(p => p.host)
    } catch {
      this.nearby = []
    }
  }

  signIn () {
    if (centralLoginEnabled()) {
      startCentralSignIn({ silent: false, returnTo: '/' }).catch(error => { this.error = describe(error) })
    } else {
      this.accountDialog = true
    }
  }

  async passkey () {
    this.busy = true
    this.error = ''
    try {
      const token = await passkeySignIn()
      window.location.assign(await finishSignIn(token, null, '/'))
    } catch (error) {
      if (!cancelledPasskey(error)) this.error = describe(error)
      this.busy = false
    }
  }

  async sendReset () {
    if (!this.note?.email) return
    this.busy = true
    this.error = ''
    try {
      await forgotPassword(this.note.email)
      this.resetSent = true
    } catch (error) {
      this.error = describe(error)
    } finally {
      this.busy = false
    }
  }
}
</script>

<style lang="scss" scoped>
  .sgo {
    gap: 28px;
  }

  .sgo__head {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    max-width: 640px;
    text-align: center;

    h1 {
      margin: 0;
      font-size: 36px;
      font-weight: 600;
      line-height: 1.15;
    }

    p {
      margin: 0;
      color: var(--m3d-text-muted);
      font-size: 16px;
    }
  }

  .sgo__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--m3d-success) 16%, transparent);
    color: var(--m3d-success);
  }

  .sgo__oks {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 16px;
  }

  .sgo__ok {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--m3d-success);
    font-size: 13px;
  }

  .sgo__ok--quiet {
    color: var(--m3d-text-muted);

    .frame-icon {
      color: var(--m3d-success);
    }
  }

  .sgo__grid {
    display: grid;
    grid-template-columns: minmax(0, 380px) minmax(0, 460px);
    gap: 16px;
    align-items: start;
    justify-content: center;
    width: 100%;

    > :only-child {
      grid-column: 1 / -1;
      justify-self: center;
      width: min(380px, 100%);
    }
  }

  .sgo__card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 18px;
  }

  .sgo__password {
    width: min(856px, 100%);
  }

  .sgo__title {
    padding: 0;
  }

  .sgo__wide {
    justify-content: center;
    width: 100%;
  }

  .sgo__found {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 10px 0;
  }

  .sgo__foot {
    color: var(--m3d-text-subtle);
    font-size: 13px;
  }

  @media (max-width: 900px) {
    .sgo__grid {
      grid-template-columns: minmax(0, 1fr);
    }

    .sgo__head h1 {
      font-size: 28px;
    }
  }
</style>
