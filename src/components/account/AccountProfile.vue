<template>
  <div
    class="acct-section"
    data-tid="account-profile"
  >
    <div class="acct-head">
      <h1>Profile</h1>
      <p>Your name is shown to people you share a printer with, next to your email address.</p>
    </div>

    <section
      class="lib-surface acct-card acct-card--pad"
      aria-label="Name and photo"
    >
      <h2 class="lib-card-title">
        Name and photo
      </h2>
      <div class="profile__photo">
        <span class="acct-avatar acct-avatar--xl">{{ initials }}</span>
        <div class="profile__photo-text">
          <span class="acct-soon">Photos come with public profiles</span>
          <span class="acct-field__note">Until then your initials stand in for you.</span>
        </div>
      </div>
      <label class="acct-field">
        <span class="acct-field__label">Name</span>
        <span class="lib-field">
          <input
            v-model="name"
            type="text"
            maxlength="64"
            autocomplete="name"
            aria-label="Name"
            data-tid="account-name"
            @keydown.enter="save"
          >
        </span>
        <span
          v-if="fromEmail"
          class="acct-field__note profile__warn"
          data-tid="account-name-from-email"
        >We made this from your email address. Put your name here, or a name you're happy to show.</span>
        <span
          v-else
          class="acct-field__note"
        >Up to 64 characters. People you invite see it next to your email address, never instead of it.</span>
      </label>
    </section>

    <div class="acct-note">
      <frame-icon
        name="info"
        small
      />
      <span><b>Nothing about you is public.</b> A handle and a public page for sharing prints come later, and they'll be off until you turn them on.</span>
    </div>

    <p
      v-if="error"
      class="acct-error"
      role="alert"
    >
      {{ error }}
    </p>
    <div class="acct-actions">
      <span
        v-if="saved"
        class="acct-subtle profile__saved"
        data-tid="account-name-saved"
      >Saved</span>
      <button
        type="button"
        class="lib-btn lib-btn--ghost"
        :disabled="!changed || busy"
        @click="reset"
      >
        Cancel
      </button>
      <button
        type="button"
        class="lib-btn lib-btn--pri"
        :disabled="!canSave"
        data-tid="account-name-save"
        @click="save"
      >
        Save changes
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { cloudState } from '@/services/muon-cloud/state'
import { accountState, describe, loadMe, renameAccount } from '@/services/account/state'
import { initialsOf } from '@/services/account/model'

/**
 * Profile (the canvas's "Account · Profile and handle", stage 1): the name,
 * which the console keeps (`PATCH /v1/me`). The photo, the handle and the
 * public page are KAN-534's, behind their flag, so here they're a line
 * saying they come later.
 */
@Component({})
export default class AccountProfile extends Vue {
  name = ''
  busy = false
  error = ''
  saved = false

  created () {
    this.reset()
    loadMe().catch(() => {})
  }

  get current (): string {
    return accountState.me?.account.name ?? cloudState.account?.name ?? ''
  }

  @Watch('current')
  onCurrent (value: string, before: string) {
    if (this.name === before) this.name = value
  }

  get initials (): string {
    return initialsOf(this.name || this.current, cloudState.account?.email)
  }

  /** The console made the name from the email's local part (`name_source`), or it still is that. */
  get fromEmail (): boolean {
    const me = accountState.me?.account
    if (me?.name_source) return me.name_source === 'email'
    const email = cloudState.account?.email ?? ''
    return !!email && this.current === email.split('@')[0]
  }

  get changed (): boolean {
    return this.name.trim() !== this.current
  }

  get canSave (): boolean {
    return this.changed && this.name.trim().length > 0 && !this.busy
  }

  reset () {
    this.name = this.current
    this.error = ''
  }

  async save () {
    if (!this.canSave) return
    this.busy = true
    this.error = ''
    this.saved = false
    try {
      await renameAccount(this.name.trim())
      this.name = this.current
      this.saved = true
    } catch (error) {
      this.error = describe(error)
    } finally {
      this.busy = false
    }
  }
}
</script>

<style lang="scss" scoped>
  .profile__photo {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .profile__photo-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .profile__warn {
    color: var(--m3d-warning);
  }

  .profile__saved {
    align-self: center;
    font-size: 13px;
  }
</style>
