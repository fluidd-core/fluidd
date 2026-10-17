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
      </div>
      <div class="acct-list">
        <div class="acct-row">
          <div class="acct-row__label">
            <b>Your profile and shared content</b>
            <span>Review your name and profile settings in Profile. Only content you choose to share is public.</span>
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
            <span>Your retained prints, versions, models and files in one archive (.tar), with their metadata.</span>
          </div>
          <button
            type="button"
            class="lib-btn lib-btn--sm"
            :disabled="busy"
            data-tid="privacy-library-download"
            @click="downloadLibrary"
          >
            Download Library
          </button>
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
import { exportLibrary } from '@/services/library/export'
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
  libraryDownload: AbortController | null = null
  beforeDestroy () { this.libraryDownload?.abort() }

  created () {
    loadMe().catch(() => {})
    accountApi.retention()
      .then((statement) => { this.rows = retentionRows(statement) })
      .catch((error) => { this.retentionError = describe(error) })
  }

  get retention (): RetentionRow[] {
    return this.rows.length ? [...this.rows, ...LIBRARY_RETENTION] : []
  }

  async downloadLibrary () {
    if (this.busy) return
    this.busy = true; this.error = ''; this.message = ''
    const controller = new AbortController(); this.libraryDownload = controller
    try {
      const blob = await exportLibrary(controller.signal)
      if (controller.signal.aborted) return
      if (blob) {
        const url = URL.createObjectURL(blob); const a = document.createElement('a')
        a.href = url; a.download = 'muon3d-library.tar'; document.body.appendChild(a); a.click(); a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 10_000)
      }
      this.message = 'Your Library archive is ready as muon3d-library.tar.'
    } catch (error) {
      if (!controller.signal.aborted) this.error = error instanceof DOMException && error.name === 'AbortError' ? 'Download cancelled.' : describe(error)
    } finally { this.busy = false; this.libraryDownload = null }
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
