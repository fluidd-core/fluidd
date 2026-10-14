<template>
  <div
    class="acct-solo"
    data-tid="sign-out-page"
  >
    <header class="acct-solo__top">
      <router-link
        to="/"
        aria-label="Muon3D home"
      >
        <span class="muon-wordmark">MUON3D</span>
      </router-link>
      <button
        type="button"
        class="lib-btn lib-btn--ghost"
        @click="stay"
      >
        <frame-icon
          name="chevronLeft"
          small
        />Back to Control
      </button>
    </header>

    <main class="acct-solo__main">
      <div
        v-if="!account"
        class="acct-solo__box"
      >
        <p class="acct-muted">
          {{ ready ? 'You\'re not signed in.' : 'Reading your account…' }}
        </p>
      </div>

      <div
        v-else
        class="acct-solo__box"
      >
        <div class="so__who">
          <span class="acct-avatar acct-avatar--lg">{{ initials }}</span>
          <div class="so__name">
            <h1>Sign out of Muon3D</h1>
            <span>{{ account.name }} · {{ account.email }}</span>
          </div>
        </div>

        <div
          class="so__choices"
          role="radiogroup"
          aria-label="Where to sign out"
        >
          <label
            class="acct-choice"
            :class="{ 'acct-choice--on': scope === 'browser' }"
            data-tid="sign-out-browser"
          >
            <input
              v-model="scope"
              type="radio"
              value="browser"
              class="acct-radio"
            >
            <span class="so__words">
              <b>This browser</b>
              <span>{{ browserLine }}</span>
            </span>
          </label>

          <label
            class="acct-choice"
            :class="{ 'acct-choice--on': scope === 'everywhere' }"
            data-tid="sign-out-everywhere"
          >
            <input
              v-model="scope"
              type="radio"
              value="everywhere"
              class="acct-radio"
            >
            <span class="so__words">
              <b>Everywhere</b>
              <span v-if="scope !== 'everywhere'">{{ everywhereLine }}</span>
              <template v-else>
                <span>{{ devices.length === 1 ? 'This device will be signed out:' : `These ${devices.length} devices will be signed out at once:` }}</span>
                <span class="so__devices">
                  <span
                    v-for="device in devices"
                    :key="device.id"
                    class="so__device"
                  >
                    <span class="acct-icon-box"><frame-icon
                      :name="iconOf(device)"
                      small
                    /></span>
                    <span class="so__words">
                      <b>{{ device.label }}<span
                        v-if="device.current"
                        class="acct-subtle"
                      > · this browser</span></b>
                      <span>{{ deviceLine(device) }}</span>
                    </span>
                  </span>
                </span>
                <span v-if="printerNames">If any of them is reaching {{ printerNames }} from outside your home, that stops too. Prints carry on.</span>
              </template>
            </span>
          </label>
        </div>

        <label
          v-if="scope === 'everywhere'"
          class="acct-choice so__check"
          data-tid="sign-out-password"
        >
          <input
            v-model="changePassword"
            type="checkbox"
            class="acct-checkbox"
          >
          <span class="so__words">
            <b>Change my password next</b>
            <span>Do this if you think someone else knows it.</span>
          </span>
        </label>

        <section
          v-else
          class="lib-surface so__same"
          aria-label="What stays the same"
        >
          <span class="lib-caps">Signing out doesn't change</span>
          <span
            v-for="line in sameLines"
            :key="line"
            class="so__same-line"
          >
            <frame-icon
              name="check"
              small
            />{{ line }}
          </span>
        </section>

        <p
          v-if="error"
          class="acct-error"
          role="alert"
        >
          {{ error }}
        </p>

        <div class="acct-actions">
          <button
            type="button"
            class="lib-btn lib-btn--lg lib-btn--ghost"
            :disabled="busy"
            data-tid="sign-out-stay"
            @click="stay"
          >
            Stay signed in
          </button>
          <button
            type="button"
            class="lib-btn lib-btn--lg"
            :class="scope === 'everywhere' ? 'lib-btn--dng' : 'lib-btn--pri'"
            :disabled="busy"
            data-tid="sign-out-confirm"
            @click="confirm"
          >
            {{ confirmText }}
          </button>
        </div>
        <span
          v-if="scope === 'browser'"
          class="so__foot"
        >On a shared computer? Sign out, then close the browser.</span>
      </div>
    </main>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { cloudState } from '@/services/muon-cloud/state'
import { accountState, describe, loadSessions } from '@/services/account/state'
import { devicesFrom, initialsOf, listText, type Device } from '@/services/account/model'
import { endEverySession, signOutNow } from '@/services/account/sign-out'
import '@/scss/muon3d-account.scss'

/**
 * `/sign-out` (the canvas's "Sign out" and "Sign out, everywhere"): this
 * browser by default, or every device, and what signing out leaves alone.
 * Everywhere ends the account's other sessions first; the console's
 * `/logout` then ends this browser's and comes back to `/signed-out`.
 */
@Component({})
export default class SignOut extends Vue {
  scope: 'browser' | 'everywhere' = 'browser'
  changePassword = false
  busy = false
  error = ''

  get ready (): boolean {
    return cloudState.ready
  }

  get account () {
    return cloudState.account
  }

  /** Signed out already: nothing to ask. */
  @Watch('ready', { immediate: true })
  onReady () {
    if (this.ready && !this.account && !this.busy) this.$router.replace('/').catch(() => {})
  }

  /** The devices, once the account is known (a fresh load restores it after this page is made). */
  @Watch('accountId', { immediate: true })
  onAccount () {
    if (this.accountId) loadSessions().catch(() => {})
  }

  get accountId (): string | null {
    return cloudState.account?.id ?? null
  }

  get initials (): string {
    return initialsOf(this.account?.name, this.account?.email)
  }

  get devices (): Device[] {
    const all = devicesFrom(accountState.sessions ?? []).filter(d => !d.leftover)
    return [...all.filter(d => d.current), ...all.filter(d => !d.current)]
  }

  get here (): Device | undefined {
    return this.devices.find(d => d.current)
  }

  get others (): Device[] {
    return this.devices.filter(d => !d.current)
  }

  get browserLine (): string {
    const here = `${this.here?.uses || 'Control'} in this browser.`
    if (!this.others.length) return here
    return `${here} ${listText(this.others.map(d => d.label))} ${this.others.length === 1 ? 'stays' : 'stay'} signed in.`
  }

  get everywhereLine (): string {
    const phone = this.devices.find(d => d.kind === 'phone')
    const count = this.devices.length
    const what = `Every browser, Slice, and the Muon3D app${phone ? ` on ${phone.label}` : ''}.`
    return count > 1 ? `${what} ${count} devices.` : what
  }

  get printerNames (): string {
    return listText(cloudState.printers.map(p => p.name))
  }

  get sameLines (): string[] {
    const names = this.printerNames
    return [
      names
        ? `${names}. Any print carries on, and ${cloudState.printers.length === 1 ? 'it stays' : 'they stay'} linked to your account.`
        : 'Your printers. Any print carries on.',
      `On this network you can still open ${cloudState.printers.length === 1 ? 'it' : 'them'} without signing in.`,
      'Who else can use your printers, and your Library.'
    ]
  }

  get confirmText (): string {
    if (this.busy) return 'Signing out…'
    if (this.scope === 'browser') return 'Sign out'
    return this.devices.length > 1 ? `Sign out of ${this.devices.length} devices` : 'Sign out everywhere'
  }

  iconOf (device: Device): string {
    if (device.kind === 'phone') return 'phone'
    return /mac|laptop/i.test(device.label) ? 'laptop' : 'monitor'
  }

  deviceLine (device: Device): string {
    if (device.kind === 'phone') return 'The Muon3D app. Its print alerts stop until you sign in there again.'
    return device.uses || 'Control'
  }

  stay () {
    if (window.history.length > 1) this.$router.back()
    else this.$router.replace('/').catch(() => {})
  }

  async confirm () {
    this.busy = true
    this.error = ''
    try {
      if (this.scope === 'everywhere') await endEverySession()
      await signOutNow(this.scope, { password: this.scope === 'everywhere' && this.changePassword, router: this.$router })
    } catch (error) {
      this.error = describe(error)
      this.busy = false
    }
  }
}
</script>

<style lang="scss" scoped>
  .so__who {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .so__name {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      line-height: 1.2;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 14px;
    }
  }

  .so__choices {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .so__words {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    > span {
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .so__devices {
    display: flex;
    flex-direction: column;
    margin: 6px 0;

    > * + * {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .so__device {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr);
    gap: 12px;
    align-items: center;
    padding: 10px 0;

    .so__words > span {
      font-size: 12px;
    }

    b {
      color: var(--m3d-text);
      font-size: 14px;
    }
  }

  .so__check {
    align-items: center;
    background: var(--m3d-surface-2);
  }

  .so__same {
    display: flex;
    flex-direction: column;
    padding: 12px 16px;
  }

  .so__same-line {
    display: grid;
    grid-template-columns: 20px minmax(0, 1fr);
    gap: 10px;
    align-items: start;
    padding: 6px 0;
    font-size: 13.5px;

    .frame-icon {
      margin-top: 2px;
      color: var(--m3d-success);
    }
  }

  .so__foot {
    color: var(--m3d-text-subtle);
    font-size: 12px;
    text-align: center;
  }
</style>
