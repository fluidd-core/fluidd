<template>
  <div
    class="acct-section"
    data-tid="account-privacy"
  >
    <div class="acct-head">
      <h1>Privacy and data</h1>
      <p>Everything starts private. Nothing of yours is public until you choose to share it.</p>
    </div>

    <section
      class="lib-surface acct-card"
      aria-label="What other people can see"
    >
      <div class="acct-card__title">
        <h2>What other people can see</h2>
        <span class="acct-card__aside">Public page: off</span>
      </div>
      <div class="acct-list">
        <div class="acct-row">
          <div class="acct-row__label">
            <b>Nothing of yours is public</b>
            <span>Sharing prints with other people, a handle and a public page come later, and they'll start off.</span>
          </div>
        </div>
        <div class="acct-row">
          <div class="acct-row__label">
            <b>People you let use a printer</b>
            <span>See your name and email address, and that printer. Nothing else of yours.</span>
          </div>
          <router-link
            :to="linkTo('printers')"
            class="lib-btn lib-btn--sm lib-btn--ghost"
          >
            See who
          </router-link>
        </div>
      </div>
    </section>

    <section
      class="lib-surface acct-card"
      aria-label="Your data"
    >
      <div class="acct-card__title">
        <h2>Your data</h2>
      </div>
      <div class="acct-list">
        <div class="acct-row">
          <div class="acct-row__label">
            <b>Account</b>
            <span>One file: your profile, devices, printers, sharing and activity, and how long we keep each.</span>
          </div>
          <button
            type="button"
            class="lib-btn lib-btn--sm"
            :disabled="busy"
            data-tid="privacy-download"
            @click="download"
          >
            Download
          </button>
        </div>
        <div class="acct-row">
          <div class="acct-row__label">
            <b>Library</b>
            <span>Every print and model, as a zip. Until then, download each from its page in your Library.</span>
          </div>
          <span class="acct-soon">Coming soon</span>
        </div>
      </div>
    </section>

    <section
      class="lib-surface acct-card"
      aria-label="How long we keep things"
      data-tid="privacy-retention"
    >
      <div class="acct-card__title">
        <h2>How long we keep things</h2>
        <span class="acct-card__aside">Also in every download</span>
      </div>
      <div class="acct-list">
        <div
          v-for="row in retention"
          :key="row.key"
          class="priv__ret"
        >
          <span>{{ row.label }}</span>
          <span class="acct-muted">{{ row.value }}</span>
        </div>
        <p
          v-if="!retention.length"
          class="acct-muted priv__reading"
        >
          {{ retentionError || 'Reading…' }}
        </p>
      </div>
    </section>

    <p
      v-if="message"
      class="acct-note acct-note--info"
      role="status"
    >
      <frame-icon
        name="info"
        small
      />
      <span>{{ message }}</span>
    </p>
    <p
      v-if="error"
      class="acct-error"
      role="alert"
    >
      {{ error }}
    </p>

    <reauth-dialog
      v-bind="reauthProps"
      v-on="reauthOn"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import AccountReauthMixin from '@/mixins/account-reauth'
import ReauthDialog from './ReauthDialog.vue'
import { accountApi } from '@/services/account/api'
import { describe, loadMe } from '@/services/account/state'
import type { AccountSectionId } from '@/services/account/model'
import { LIBRARY_RETENTION, retentionRows, type RetentionRow } from '@/services/account/retention'

/**
 * Privacy and data (the canvas's "Account · Privacy and data", stage 1):
 * what's public (nothing, until sharing comes), the account's download, and
 * how long each thing is kept, from the console's own statement
 * (`GET /v1/retention`, the numbers its deletion job uses) and the
 * Library's.
 */
@Component({ components: { ReauthDialog } })
export default class AccountPrivacy extends Mixins(AccountReauthMixin) {
  @Prop({ type: Function, required: true })
  readonly linkTo!: (id: AccountSectionId) => string

  rows: RetentionRow[] = []
  retentionError = ''
  busy = false
  error = ''
  message = ''

  created () {
    loadMe().catch(() => {})
    accountApi.retention()
      .then((statement) => { this.rows = retentionRows(statement) })
      .catch((error) => { this.retentionError = describe(error) })
  }

  get retention (): RetentionRow[] {
    return this.rows.length ? [...this.rows, ...LIBRARY_RETENTION] : []
  }

  async download () {
    this.busy = true
    this.error = ''
    this.message = ''
    try {
      const response = await this.withReauth(r => accountApi.exportAccount(r.password ? r : undefined), {
        why: 'Your download holds everything about your account, so it needs a fresh sign-in.',
        action: 'Download'
      })
      if (!response) return
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'muon3d-account.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      this.message = 'Your account is downloading as muon3d-account.json.'
    } catch (error) {
      this.error = describe(error)
    } finally {
      this.busy = false
    }
  }
}
</script>

<style lang="scss" scoped>
  .priv__ret {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 12px;
    padding: 9px 0;
    font-size: 13.5px;
  }

  .priv__reading {
    margin: 0;
    padding: 12px 0;
    font-size: 13px;
  }
</style>
