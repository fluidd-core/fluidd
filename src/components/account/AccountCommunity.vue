<template>
  <section
    class="lib-surface acct-card acct-card--pad"
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
      >
        Delivery pending. A previous public identity can remain visible for up to two minutes. Refresh to check.
      </p>
      <template v-if="identity.declared_age === null">
        <label class="acct-field">
          <span class="acct-field__label">Your age</span>
          <span class="lib-field"><input
            v-model="age"
            aria-label="Your age"
            type="number"
            min="13"
            max="120"
            inputmode="numeric"
          ></span>
          <span class="acct-field__note">Never shown on your profile. Confirm once; contact support for a correction. Accounts require age 13 or over.</span>
        </label>
        <button
          class="lib-btn lib-btn--pri"
          type="button"
          :disabled="busy || !validAge"
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
              aria-label="Username"
              maxlength="24"
              autocomplete="off"
              :disabled="busy"
            ></span>
            <span class="acct-field__note">3–24 letters, digits, dots or underscores. Changes are limited to once every 30 days.</span>
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
              :disabled="busy || !handle.trim() || handle === profile.handle"
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
      class="acct-error"
      role="alert"
    >
      {{ error }}
    </p>
    <button
      class="lib-btn lib-btn--ghost"
      type="button"
      :disabled="loading || busy"
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
  generation = 0
  created () { this.load() }
  beforeDestroy () { this.generation++ }
  get session () { return cloudState.account?.id ?? '' }
  @Watch('session') sessionChanged () { this.generation++; this.identity = null; this.profile = null; this.age = ''; this.error = ''; this.busy = false; this.loading = false }
  get validAge () { return /^\d+$/.test(this.age) && Number(this.age) >= 13 && Number(this.age) <= 120 }
  get publicUrl () { return this.profile?.identity_public && this.profile.page_on && this.profile.can_public && this.profile.handle ? `https://library.muon3d.com/@${encodeURIComponent(this.profile.handle)}` : '' }
  async load () {
    const mine = ++this.generation; const token = storedToken()
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

  cancel () { this.handle = this.profile?.handle ?? ''; this.visibility = this.identity?.identity_public ?? false; this.error = '' }
  async confirmAge () { if (this.validAge) await this.mutate(() => communityApi.saveIdentity({ declared_age: Number(this.age) })) }
  async saveVisibility () { await this.mutate(() => communityApi.saveIdentity({ identity_public: this.visibility })) }
  async claim () { await this.mutate(() => communityApi.claim(this.handle.trim())) }
  async mutate (action: () => Promise<unknown>) {
    if (this.busy) return
    const mine = this.generation; const token = storedToken()
    this.busy = true; this.error = ''
    try { await action(); if (mine === this.generation && token === storedToken()) await this.load() } catch (e) { if (mine === this.generation && token === storedToken()) this.error = (e as Error).message } finally { if (token === storedToken()) this.busy = false }
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
</style>
