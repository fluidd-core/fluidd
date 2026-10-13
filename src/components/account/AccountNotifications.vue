<template>
  <div
    class="acct-section"
    data-tid="account-notifications"
  >
    <div class="acct-head">
      <h1>Notifications</h1>
      <p>Print alerts go to your phone, sealed by the printer so we can't read them. Email is for your account, never for what you print.</p>
    </div>

    <div class="acct-grid2 note__grid">
      <section
        class="lib-surface acct-card"
        aria-label="What you hear about"
      >
        <div class="note__mx note__th">
          <span>Prints</span><span class="note__c">Phone</span><span class="note__c">Email</span>
        </div>
        <div class="acct-list">
          <div
            v-for="kind in printKinds"
            :key="kind.id"
            class="note__mx"
          >
            <span class="acct-row__label"><span class="note__label">{{ kind.label }}</span><span
              v-if="kind.sub"
              class="acct-subtle"
            >{{ kind.sub }}</span></span>
            <span class="note__c acct-soon">In the app</span>
            <span class="note__c acct-subtle">Phone only</span>
          </div>
        </div>
        <div class="note__mx note__th">
          <span>Your account</span><span /><span />
        </div>
        <div class="acct-list">
          <div
            v-for="kind in accountKinds"
            :key="kind.id"
            class="note__mx"
          >
            <span class="acct-row__label"><span class="note__label">{{ kind.label }}</span><span
              v-if="kind.sub"
              class="acct-subtle"
            >{{ kind.sub }}</span></span>
            <span class="note__c acct-subtle">{{ kind.phone }}</span>
            <span class="note__c">
              <span
                v-if="kind.always"
                class="lib-pill lib-pill--ok"
              >Always</span>
              <toggle-switch
                v-else
                :value="preference(kind.id)"
                :label="`${kind.label} by email`"
                :disabled="!preferences || busy"
                :data-tid="`notify-${kind.id}`"
                @input="set(kind.id, $event)"
              />
            </span>
          </div>
        </div>
        <p
          v-if="prefsMissing"
          class="acct-field__note note__soon"
          data-tid="notify-soon"
        >
          Choosing which emails you get comes soon. Until then we send the account emails above, and no news.
        </p>
      </section>

      <div class="note__side">
        <section
          class="lib-surface acct-card"
          aria-label="Which printers"
        >
          <div class="acct-card__title">
            <h2>Which printers</h2>
            <span class="acct-card__aside">Print alerts</span>
          </div>
          <div class="acct-list">
            <div
              v-for="p in printers"
              :key="p.id"
              class="acct-row note__row"
            >
              <span class="note__printer"><printer-thumb
                :size="32"
                :state="p.online ? 'idle' : 'offline'"
              /><span class="acct-row__label"><span class="note__label">{{ p.name }}</span><span
                v-if="p.shared"
                class="acct-subtle"
              >Shared with you</span></span></span>
              <span class="acct-soon">Chosen on each phone</span>
            </div>
            <p
              v-if="!printers.length"
              class="acct-muted note__empty"
            >
              No printers in your account yet.
            </p>
          </div>
        </section>
        <section
          class="lib-surface acct-card"
          aria-label="Phones that get them"
        >
          <div class="acct-card__title">
            <h2>Phones that get them</h2>
          </div>
          <div class="acct-list">
            <div
              v-for="phone in phones"
              :key="phone.id"
              class="acct-row note__row"
            >
              <span class="note__printer"><span class="acct-icon-box note__phone"><frame-icon
                name="phone"
                small
              /></span><span class="note__label">{{ phone.label }}</span></span>
              <span class="lib-pill">Set in the app</span>
            </div>
          </div>
          <p class="acct-field__note note__empty">
            {{ phones.length ? 'Each phone turns alerts on for the printers it wants, in the Muon3D app.' : 'No phone is signed in. Print alerts come with the Muon3D app.' }} A browser can't receive print alerts.
          </p>
        </section>
      </div>
    </div>

    <p
      v-if="error"
      class="acct-error"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import PrinterThumb from '@/components/ui/PrinterThumb.vue'
import { cloudState } from '@/services/muon-cloud/state'
import type { CloudPrinter } from '@/services/muon-cloud/api'
import { accountApi, type EmailPreferences } from '@/services/account/api'
import { isMissing } from '@/services/account/client'
import { accountState, describe, loadSessions } from '@/services/account/state'
import { devicesFrom, type Device } from '@/services/account/model'

type PreferenceId = keyof EmailPreferences

/**
 * Notifications (the canvas's "Account · Notifications"). Print alerts are
 * sealed by the printer for one phone (ADR 0028), so they're chosen on that
 * phone, in the app, and never sent by email: here they're described, not
 * switched. Email is for the account: access requests, sharing, and news
 * only when asked for (`/v1/me/preferences`). Security email is always on.
 */
@Component({ components: { ToggleSwitch, PrinterThumb } })
export default class AccountNotifications extends Vue {
  preferences: EmailPreferences | null = null
  prefsMissing = false
  busy = false
  error = ''

  printKinds = [
    { id: 'finished', label: 'Finished' },
    { id: 'failed', label: 'Failed or stopped' },
    { id: 'paused', label: 'Paused, needs you', sub: 'Filament ran out, or a check failed' },
    { id: 'update', label: 'Update ready' }
  ]

  accountKinds: Array<{ id: PreferenceId | 'security', label: string, sub?: string, phone: string, always?: boolean }> = [
    { id: 'email_access_requests', label: 'Someone asks to use a printer', phone: 'In the app' },
    { id: 'email_shared_with_you', label: 'A printer is shared with you', phone: 'In the app' },
    { id: 'email_news', label: 'News from Muon3D', sub: 'A few emails a year. Off unless you turn it on.', phone: '–' },
    { id: 'security', label: 'Security', sub: 'New sign-ins, password and email changes', phone: '–', always: true }
  ]

  created () {
    loadSessions().catch(() => {})
    accountApi.preferences()
      .then((p) => { this.preferences = p })
      .catch((error) => {
        if (isMissing(error)) this.prefsMissing = true
        else this.error = describe(error)
      })
  }

  get printers (): CloudPrinter[] {
    return cloudState.printers
  }

  get phones (): Device[] {
    return accountState.sessions ? devicesFrom(accountState.sessions).filter(d => d.kind === 'phone') : []
  }

  preference (id: string): boolean {
    if (!this.preferences) return id === 'email_access_requests' || id === 'email_shared_with_you'
    return this.preferences[id as PreferenceId] === true
  }

  async set (id: string, value: boolean) {
    if (!this.preferences) return
    this.busy = true
    this.error = ''
    try {
      this.preferences = await accountApi.setPreferences({ [id]: value })
    } catch (error) {
      this.error = describe(error)
    } finally {
      this.busy = false
    }
  }
}
</script>

<style lang="scss" scoped>
  .note__grid {
    align-items: start;
  }

  .note__mx {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 92px 92px;
    gap: 12px;
    align-items: center;
    min-height: 44px;
    padding: 10px 0;
  }

  .note__th {
    min-height: 0;
    padding: 14px 0 2px;
    color: var(--m3d-text-subtle);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .note__c {
    display: flex;
    justify-content: center;
    font-size: 11.5px;
    text-align: center;
  }

  .note__label {
    color: var(--m3d-text) !important;
    font-size: 14px !important;
  }

  .note__soon {
    display: block;
    padding: 0 0 14px;
  }

  .note__side {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .note__row {
    min-height: 52px;
  }

  .note__printer {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .note__phone {
    width: 32px;
    height: 32px;
  }

  .note__empty {
    display: block;
    margin: 0;
    padding: 10px 0 14px;
    font-size: 12px;
  }
</style>
