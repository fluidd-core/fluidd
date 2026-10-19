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

        <p class="acct-muted">
          Control and Slice in this browser will be signed out. Your other devices stay signed in.
        </p>
        <router-link
          to="/account/sessions"
          class="acct-link"
        >
          Manage your other devices
        </router-link>

        <section
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
            class="lib-btn lib-btn--lg lib-btn--pri"
            :disabled="busy"
            data-tid="sign-out-confirm"
            @click="confirm"
          >
            {{ busy ? 'Signing out…' : 'Sign out of this browser' }}
          </button>
        </div>
        <span
          class="so__foot"
        >On a shared computer? Sign out, then close the browser.</span>
      </div>
    </main>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { cloudState } from '@/services/muon-cloud/state'
import { describe } from '@/services/account/state'
import { initialsOf, listText } from '@/services/account/model'
import { signOutNow } from '@/services/account/sign-out'
import '@/scss/muon3d-account.scss'

/** A bookmarked sign-out route. Loading a GET never ends a session. */
@Component({})
export default class SignOut extends Vue {
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

  get initials (): string {
    return initialsOf(this.account?.name, this.account?.email)
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

  stay () {
    if (window.history.length > 1) this.$router.back()
    else this.$router.replace('/').catch(() => {})
  }

  async confirm () {
    if (this.busy) return
    this.busy = true
    this.error = ''
    try {
      await signOutNow('browser', { router: this.$router })
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
