<template>
  <div
    class="acct-section"
    data-tid="account-privacy"
  >
    <div class="acct-head">
      <h1>Privacy and data</h1>
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
            <span>Private unless you share it</span>
          </div>
        </div>
        <div class="acct-row">
          <div class="acct-row__label">
            <b>People you let use a printer</b>
            <span>Your name, email and that printer. Nothing else.</span>
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
            <span>Profile, devices, printers, sharing and activity</span>
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
            <span>Prints, models and files, as one .tar</span>
          </div>
          <button
            type="button"
            class="lib-btn lib-btn--sm"
            :disabled="busy"
            data-tid="privacy-library-download"
            @click="downloadLibrary"
          >
            {{ libraryDownload ? 'Downloading…' : 'Download Library' }}
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
      v-if="progress"
      class="acct-note acct-note--info"
      aria-hidden="true"
      data-tid="privacy-download-progress"
    >
      {{ progress }}
    </p>
    <p
      v-if="announcement"
      :class="['acct-note', 'acct-note--info', { 'sr-only': progress }]"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-tid="privacy-download-status"
    >
      <frame-icon
        name="info"
        small
      />
      <span>{{ announcement }}</span>
    </p>
    <p
      v-if="error"
      class="acct-error"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
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
  progress = ''
  announcedProgress = ''
  lastAnnouncedPercent = -10
  lastAnnouncedAt = 0
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

  get announcement () { return this.message || this.announcedProgress }

  async downloadLibrary () {
    if (this.busy) return
    this.busy = true; this.error = ''; this.message = ''; this.progress = 'Preparing your Library archive…'; this.announcedProgress = this.progress
    this.lastAnnouncedPercent = 0; this.lastAnnouncedAt = Date.now()
    const controller = new AbortController(); this.libraryDownload = controller
    try {
      const blob = await exportLibrary(controller.signal, (received, total) => {
        const amount = `${(received / 1024 / 1024).toFixed(1)} MiB received`
        this.progress = total ? `Downloading your Library archive: ${amount} of ${(total / 1024 / 1024).toFixed(1)} MiB.` : `Downloading your Library archive: ${amount}.`
        const percent = total ? Math.min(100, Math.floor(received / total * 100)) : null
        const now = Date.now()
        if ((percent !== null && percent - this.lastAnnouncedPercent >= 10) || now - this.lastAnnouncedAt >= 5000) {
          this.announcedProgress = this.progress
          if (percent !== null) this.lastAnnouncedPercent = percent
          this.lastAnnouncedAt = now
        }
      })
      if (controller.signal.aborted) return
      if (blob) {
        const url = URL.createObjectURL(blob); const a = document.createElement('a')
        a.href = url; a.download = 'muon3d-library.tar'; document.body.appendChild(a); a.click(); a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 10_000)
      }
      this.progress = ''; this.announcedProgress = ''; this.message = 'Your Library archive is ready as muon3d-library.tar.'
    } catch (error) {
      if (!controller.signal.aborted) this.error = error instanceof DOMException && error.name === 'AbortError' ? 'Download cancelled. No file was saved.' : describe(error)
    } finally { this.progress = ''; this.announcedProgress = ''; this.busy = false; this.libraryDownload = null }
  }

  async download () {
    if (this.busy) return
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
