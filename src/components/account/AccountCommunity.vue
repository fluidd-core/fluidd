<template>
  <section
    class="lib-surface acct-card acct-card--pad account-community"
    aria-label="Library identity"
  >
    <h2 class="lib-card-title">
      Library identity
    </h2>
    <p v-if="loading">
      Reading your community settings…
    </p>
    <template v-if="identity">
      <p
        v-if="identity.projection_pending"
        role="status"
        aria-live="polite"
      >
        Delivery pending. A previous public identity can remain visible for up to two minutes. Refresh to check.
      </p>
      <template v-if="identity.declared_age === null">
        <label class="acct-field">
          <span class="lib-field"><input
            v-model="age"
            data-tid="community-age"
            aria-labelledby="community-age-label"
            aria-label="Your age"
            :aria-describedby="ageDescribedBy"
            :aria-invalid="ageError ? 'true' : undefined"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            @blur="ageTouched = true"
          ></span>
          <span
            id="community-age-label"
            class="acct-field__label"
          >Your age</span>
          <span
            id="community-age-help"
            class="acct-field__note"
          >Never shown on your profile. Confirm once; contact support for a correction. Accounts require age 13 or over.</span>
          <span
            v-if="ageError"
            id="community-age-error"
            class="acct-error"
            role="alert"
          >{{ ageError }}</span>
        </label>
        <button
          class="lib-btn lib-btn--pri"
          type="button"
          :disabled="busy || !validAge"
          data-tid="community-confirm-age"
          @click="confirmAge"
        >
          Confirm age
        </button>
      </template>
      <template v-else>
        <p>Age confirmed privately. {{ identity.can_public ? 'Public profiles are available.' : 'Private and link sharing are available; public profiles need adult eligibility.' }}</p>
        <label class="acct-field">
          <span class="acct-field__label">Name and username</span>
          <select
            v-model="visibility"
            aria-label="Name and username visibility"
            :disabled="busy"
          >
            <option :value="false">Private</option>
            <option
              :value="true"
              :disabled="!identity.can_public"
            >Public</option>
          </select>
          <span class="acct-field__note">One setting controls your account name and @username in the community. Printer access still shows your confirmed email.</span>
        </label>
        <button
          class="lib-btn lib-btn--pri"
          type="button"
          :disabled="busy || visibility === identity.identity_public"
          @click="saveVisibility"
        >
          Save visibility
        </button>
        <template v-if="profile">
          <label class="acct-field">
            <span class="acct-field__label">Username</span>
            <span class="lib-field"><input
              v-model="handle"
              data-tid="community-handle"
              aria-labelledby="community-handle-label"
              aria-label="Username"
              :aria-describedby="handleDescribedBy"
              :aria-invalid="handleError ? 'true' : undefined"
              maxlength="24"
              autocomplete="off"
              :disabled="busy"
              @blur="handleTouched = true"
            ></span>
            <span
              id="community-handle-label"
              class="acct-field__label"
            >Username</span>
            <span
              id="community-handle-help"
              class="acct-field__note"
            >3–24 letters, digits, dots or underscores. Changes are limited to once every 30 days.</span>
            <span
              v-if="handleError"
              id="community-handle-error"
              class="acct-error"
              role="alert"
            >{{ handleError }}</span>
          </label>
          <div class="acct-actions">
            <button
              class="lib-btn lib-btn--ghost"
              type="button"
              data-tid="community-cancel"
              :disabled="busy"
              @click="cancel"
            >
              Cancel
            </button>
            <button
              class="lib-btn lib-btn--pri"
              type="button"
              data-tid="community-claim"
              :disabled="busy || !validHandle || handle === profile.handle"
              @click="claim"
            >
              Save username
            </button>
          </div>
          <p aria-label="Community identity preview">
            {{ profile.identity_public ? profile.public_name : 'Anonymous maker' }}<span v-if="profile.identity_public && profile.handle"> · @{{ profile.handle }}</span>
          </p>
          <a
            v-if="publicUrl"
            :href="publicUrl"
            target="_blank"
            rel="noopener"
          >View public profile</a>
        </template>
        <p v-else-if="!loading">
          Community settings are waiting for delivery or are switched off.
        </p>
        <p><a href="https://library.muon3d.com/#/settings">Edit your page, bio and photo in Library</a></p>
      </template>
    </template>
    <p
      v-if="error"
      id="community-error"
      class="acct-error"
      role="alert"
      aria-live="assertive"
    >
      {{ error }}
    </p>
    <p
      v-if="signedOut"
      data-tid="community-signed-out"
      role="status"
      aria-live="polite"
    >
      You signed out while editing. Sign in again to change your Library identity.
    </p>
    <button
      v-if="!signedOut"
      class="lib-btn lib-btn--ghost"
      type="button"
      :disabled="loading || busy"
      data-tid="community-refresh"
      @click="load"
    >
      Refresh
    </button>
  </section>
</template>
<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { communityApi, type CommunityIdentity, type CommunityProfile } from '@/services/account/community'
import { storedToken } from '@/services/muon-cloud/api'
import { cloudState } from '@/services/muon-cloud/state'
@Component({})
export default class AccountCommunity extends Vue {
  identity: CommunityIdentity | null = null
  profile: CommunityProfile | null = null
  age = ''
  handle = ''
  visibility = false
  loading = false
  busy = false
  error = ''
  ageTouched = false
  handleTouched = false
  signedOut = false
  generation = 0
  created () { this.load() }
  beforeDestroy () { this.generation++ }
  get session () { return cloudState.account?.id ?? '' }
  @Watch('session') sessionChanged () { this.generation++; this.identity = null; this.profile = null; this.age = ''; this.error = ''; this.busy = false; this.loading = false; this.signedOut = !this.session || !storedToken() }
  get validAge () { return /^\d+$/.test(this.age) && Number(this.age) >= 13 && Number(this.age) <= 120 }
  get ageError () { if (!this.ageTouched) return ''; return !/^\d+$/.test(this.age) ? 'Enter your age as a whole number.' : this.validAge ? '' : 'Age must be between 13 and 120.' }
  get ageDescribedBy () { return `community-age-help${this.ageError ? ' community-age-error' : ''}` }
  get validHandle () { return /^[A-Za-z0-9._]{3,24}$/.test(this.handle.trim()) }
  get handleError () { return this.handleTouched && !this.validHandle ? 'Use 3–24 letters, digits, dots or underscores.' : '' }
  get handleDescribedBy () { return `community-handle-help${this.handleError ? ' community-handle-error' : ''}${this.error ? ' community-error' : ''}` }
  get publicUrl () { return this.profile?.identity_public && this.profile.page_on && this.profile.can_public && this.profile.handle ? `https://library.muon3d.com/@${encodeURIComponent(this.profile.handle)}` : '' }
  async load () {
    const mine = ++this.generation; const token = storedToken()
    if (!token || !this.session) { this.signedOut = true; return }
    this.signedOut = false
    this.loading = true; this.error = ''; this.profile = null; this.identity = null
    try {
      const identity = await communityApi.identity()
      if (mine !== this.generation || token !== storedToken()) return
      this.identity = identity; this.visibility = identity.identity_public
      if (identity.can_community) {
        const profile = await communityApi.profile()
        if (mine !== this.generation || token !== storedToken()) return
        this.profile = profile; this.handle = profile.handle ?? ''
      }
    } catch (e) { if (mine === this.generation && token === storedToken()) this.error = (e as Error).message } finally { if (mine === this.generation) this.loading = false }
  }

  cancel () { this.handle = this.profile?.handle ?? ''; this.visibility = this.identity?.identity_public ?? false; this.error = ''; this.handleTouched = false }
  async confirmAge () { this.ageTouched = true; if (this.validAge) await this.mutate(() => communityApi.saveIdentity({ declared_age: Number(this.age) }), true) }
  async saveVisibility () { await this.mutate(() => communityApi.saveIdentity({ identity_public: this.visibility })) }
  async claim () { this.handleTouched = true; if (this.validHandle) await this.mutate(() => communityApi.claim(this.handle.trim())) }
  async mutate (action: () => Promise<unknown>, ageDeclaration = false) {
    if (this.busy) return
    const mine = this.generation; const token = storedToken()
    this.busy = true; this.error = ''
    try { await action(); if (mine === this.generation && token === storedToken()) await this.load() } catch (e) {
      if (mine === this.generation && token === storedToken()) {
        if (ageDeclaration && (e as { status?: number }).status === 409) await this.load()
        else this.error = (e as Error).message
      }
    } finally { if (token === storedToken()) this.busy = false }
  }
}
</script>

<style lang="scss" scoped>
select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--m3d-border);
  border-radius: 12px;
  background: var(--m3d-surface);
  color: var(--m3d-text);
  font: inherit;
}
.account-community { min-width: 0; max-width: 100%; overflow-wrap: anywhere; }
.account-community input, .account-community select { min-width: 0; max-width: 100%; }
</style>
