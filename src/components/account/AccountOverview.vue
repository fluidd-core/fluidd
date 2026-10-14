<template>
  <div
    class="acct-section"
    data-tid="account-overview"
  >
    <div
      v-if="deletionDay"
      class="acct-note acct-note--bad acct-deleting"
      role="status"
      data-tid="account-deletion-waiting"
    >
      <frame-icon
        name="clock"
        small
      />
      <span><b>Your account will be deleted on {{ deletionDay }}.</b> Until then you can keep it.</span>
      <router-link
        :to="linkTo('delete')"
        class="lib-btn lib-btn--sm lib-btn--pri"
      >
        Keep my account
      </router-link>
    </div>

    <section
      class="lib-surface acct-you"
      aria-label="You"
    >
      <span class="acct-avatar acct-avatar--xl">{{ initials }}</span>
      <div class="acct-you__who">
        <h1>{{ account ? account.name : '' }}</h1>
        <span class="acct-you__line">
          <span data-tid="account-email">{{ account ? account.email : '' }}</span>
          <span
            v-if="details && details.email_verified === true"
            class="lib-pill lib-pill--ok"
          ><frame-icon
            name="check"
            small
          />Verified</span>
          <span
            v-else-if="details && details.email_verified === false"
            class="lib-pill lib-pill--warn"
          >Not confirmed yet</span>
        </span>
        <span
          v-if="account"
          class="acct-you__since"
        >Member since {{ since }}</span>
      </div>
      <router-link
        :to="linkTo('profile')"
        class="lib-btn"
        data-tid="account-edit-profile"
      >
        Edit profile
      </router-link>
    </section>

    <div class="acct-grid3">
      <component
        :is="tileTag('security')"
        :to="tileTo('security')"
        class="lib-surface acct-tile"
        data-tid="account-tile-security"
      >
        <span class="acct-tile__top"><frame-icon
          name="shield"
          small
        />Sign-in and security<frame-icon
          v-if="built('security')"
          name="chevronRight"
          small
          class="acct-tile__go"
        /></span>
        <template v-if="me">
          <span class="acct-tile__status"><span
            class="acct-dot"
            :class="`acct-dot--${health.level}`"
          />{{ health.title }}</span>
          <span class="acct-muted">{{ methods }}</span>
        </template>
        <span
          v-else
          class="acct-muted"
        >Reading…</span>
      </component>

      <component
        :is="tileTag('sessions')"
        :to="tileTo('sessions')"
        class="lib-surface acct-tile"
        data-tid="account-tile-sessions"
      >
        <span class="acct-tile__top"><frame-icon
          name="devices"
          small
        />Devices and sessions<frame-icon
          v-if="built('sessions')"
          name="chevronRight"
          small
          class="acct-tile__go"
        /></span>
        <template v-if="devices">
          <span class="acct-tile__status"><span class="acct-dot" />Signed in on {{ deviceCount }}</span>
          <span class="acct-muted">{{ devicesText }}</span>
        </template>
        <span
          v-else
          class="acct-muted"
        >Reading…</span>
      </component>

      <component
        :is="tileTag('printers')"
        :to="tileTo('printers')"
        class="lib-surface acct-tile"
        data-tid="account-tile-printers"
      >
        <span class="acct-tile__top"><frame-icon
          name="printer"
          small
        />Printers and access<frame-icon
          v-if="built('printers')"
          name="chevronRight"
          small
          class="acct-tile__go"
        /></span>
        <span
          v-if="printers.length"
          class="acct-tile__status"
        >
          <printer-thumb
            v-for="p in printers.slice(0, 3)"
            :key="p.id"
            :size="32"
            :state="thumbOf(p)"
          />
          <span>{{ printerNames }}</span>
        </span>
        <span class="acct-muted">{{ printersText }}</span>
      </component>

      <div
        class="lib-surface acct-tile"
        data-tid="account-tile-notifications"
      >
        <span class="acct-tile__top"><frame-icon
          name="bell"
          small
        />Notifications</span>
        <span>Finished, failed and needs you</span>
        <span class="acct-muted">Print alerts go to your phone, set up in the Muon3D app. Security emails always go to {{ account ? account.email : 'your address' }}.</span>
      </div>

      <router-link
        :to="linkTo('library')"
        class="lib-surface acct-tile"
        data-tid="account-tile-library"
      >
        <span class="acct-tile__top"><frame-icon
          name="library"
          small
        />Library and storage<frame-icon
          name="chevronRight"
          small
          class="acct-tile__go"
        /></span>
        <template v-if="libraryOn">
          <span class="acct-tile__status"><span class="grow">{{ usedText }} used</span><span class="acct-muted">{{ quotaText }}</span></span>
          <span class="lib-bar"><i :style="{ width: `${usedPercent}%` }" /></span>
          <span class="acct-muted">{{ libraryCounts }}</span>
        </template>
        <span
          v-else
          class="acct-muted"
        >{{ libraryOffText }}</span>
      </router-link>

      <component
        :is="tileTag('privacy')"
        :to="tileTo('privacy')"
        class="lib-surface acct-tile"
        data-tid="account-tile-privacy"
      >
        <span class="acct-tile__top"><frame-icon
          name="eye"
          small
        />Privacy and data<frame-icon
          v-if="built('privacy')"
          name="chevronRight"
          small
          class="acct-tile__go"
        /></span>
        <span>Nothing of yours is public</span>
        <span class="acct-muted">Download your data, or read how long we keep each thing.</span>
      </component>
    </div>

    <router-link
      :to="linkTo('plan')"
      class="lib-surface acct-card--pad acct-plan"
      data-tid="account-tile-plan"
    >
      <span class="acct-icon-box"><frame-icon
        name="card"
        small
      /></span>
      <span class="acct-row__label">
        <b>Free plan</b>
        <span>Everything your printers do stays free for good. Paid plans for more storage and Create come later.</span>
      </span>
      <span class="lib-pill">Plans coming soon</span>
    </router-link>

    <section
      v-if="recent.length"
      class="lib-surface acct-card"
      aria-label="Recent activity"
      data-tid="account-recent"
    >
      <div class="acct-card__title">
        <h2>Recent activity</h2>
        <router-link
          v-if="built('sessions')"
          :to="linkTo('sessions')"
          class="acct-link"
        >
          All activity
        </router-link>
      </div>
      <div class="acct-list">
        <div
          v-for="item in recent"
          :key="item.id"
          class="acct-lrow"
        >
          <frame-icon
            :name="item.icon"
            small
            class="acct-muted"
          />
          <span class="acct-lrow__text">{{ item.text }}</span>
          <span class="acct-lrow__time">{{ item.when }}</span>
        </div>
      </div>
    </section>

    <p
      v-if="error"
      class="acct-error"
    >
      {{ error }}
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import PrinterThumb, { type ThumbState } from '@/components/ui/PrinterThumb.vue'
import { cloudState } from '@/services/muon-cloud/state'
import type { CloudPrinter } from '@/services/muon-cloud/api'
import { accountState, loadOverview } from '@/services/account/state'
import {
  ACCOUNT_SECTIONS,
  dayText,
  deviceCount,
  devicesFrom,
  devicesLine,
  eventLine,
  initialsOf,
  listText,
  methodsLine,
  monthText,
  securityHealth,
  whenText,
  type AccountSectionId,
  type Device,
  type SecurityHealth
} from '@/services/account/model'
import { libraryItems, libraryPrints, libraryState, refreshLibrary, watchLibraryAccount } from '@/services/library/store'
import { bytesText } from '@/services/library/format'
import type { AccountDetails, Me } from '@/services/account/api'

const EVENT_ICONS: Record<string, string> = {
  signIn: 'signIn',
  signOut: 'logout',
  key: 'key',
  shield: 'shield',
  userPlus: 'userPlus',
  userMinus: 'userMinus',
  mail: 'mail',
  lock: 'lock',
  alert: 'alert',
  link: 'link'
}

/**
 * The Account overview (the canvas's "Account · Overview"): who you are, a
 * tile for each part of the account with what matters in it, the plan, and
 * the last few things that happened. A tile opens its section once that
 * section's page exists.
 */
@Component({ components: { PrinterThumb } })
export default class AccountOverview extends Vue {
  @Prop({ type: Function, required: true })
  readonly linkTo!: (id: AccountSectionId) => string

  created () {
    loadOverview()
    watchLibraryAccount()
    refreshLibrary().catch(() => {})
  }

  get me (): Me | null {
    return accountState.me
  }

  get account () {
    return cloudState.account
  }

  get details (): AccountDetails | null {
    return accountState.me?.account ?? null
  }

  get error (): string {
    return accountState.error
  }

  /** A deletion waiting out its 14 days (KAN-532 §2.7). */
  get deletionDay (): string {
    const at = this.me?.account.deletion?.delete_after
    return at ? dayText(at) : ''
  }

  get initials (): string {
    return initialsOf(this.account?.name, this.account?.email)
  }

  get since (): string {
    return monthText(this.details?.created_at ?? this.account?.created_at ?? 0)
  }

  built (id: AccountSectionId): boolean {
    return ACCOUNT_SECTIONS.some(s => s.id === id && s.built)
  }

  tileTag (id: AccountSectionId): string {
    return this.built(id) ? 'router-link' : 'div'
  }

  tileTo (id: AccountSectionId): string | undefined {
    return this.built(id) ? this.linkTo(id) : undefined
  }

  get health (): SecurityHealth {
    return securityHealth(this.me as Me)
  }

  get methods (): string {
    return this.me ? methodsLine(this.me) : ''
  }

  get devices (): Device[] | null {
    return accountState.sessions ? devicesFrom(accountState.sessions) : null
  }

  get deviceCount (): number {
    return this.devices ? deviceCount(this.devices) : 0
  }

  get devicesText (): string {
    return this.devices ? devicesLine(this.devices) : ''
  }

  get printers (): CloudPrinter[] {
    return cloudState.printers
  }

  thumbOf (p: CloudPrinter): ThumbState {
    if (!p.online) return 'offline'
    const state = cloudState.status[p.id]?.state
    return state === 'printing' || state === 'paused' ? 'printing' : 'idle'
  }

  get printerNames (): string {
    return listText(this.printers.slice(0, 3).map(p => p.name)) + (this.printers.length > 3 ? ` and ${this.printers.length - 3} more` : '')
  }

  get printersText (): string {
    if (!this.printers.length) return 'No printers in your account yet.'
    const yours = this.printers.filter(p => !p.shared).length
    const shared = this.printers.length - yours
    const parts: string[] = []
    if (yours && !shared) parts.push(yours === 1 ? 'Yours.' : yours === 2 ? 'Both yours.' : 'All yours.')
    else parts.push(`${yours} yours, ${shared} shared with you.`)
    const waiting = accountState.approvals?.length ?? 0
    if (waiting) parts.push(waiting === 1 ? 'One request waiting.' : `${waiting} requests waiting.`)
    return parts.join(' ')
  }

  get libraryOn (): boolean {
    return libraryState.account !== null && libraryState.checked && libraryState.enabled
  }

  get libraryOffText (): string {
    if (!libraryState.checked) return libraryState.error ? 'Your Library didn\'t answer.' : 'Reading…'
    return 'Your Library is off. Turn it on to keep what you slice.'
  }

  get usedText (): string {
    return libraryState.usedBytes === null ? '…' : bytesText(libraryState.usedBytes)
  }

  get quotaText (): string {
    return libraryState.quotaBytes ? `of ${bytesText(libraryState.quotaBytes)}` : ''
  }

  get usedPercent (): number {
    const used = libraryState.usedBytes ?? 0
    const quota = libraryState.quotaBytes ?? 0
    return quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0
  }

  get libraryCounts (): string {
    const prints = libraryPrints().length
    const models = libraryItems().length - prints
    const parts = [prints === 1 ? '1 print' : `${prints} prints`]
    if (models) parts.push(models === 1 ? '1 model' : `${models} models`)
    return parts.join(', ')
  }

  get recent (): Array<{ id: string, icon: string, text: string, when: string }> {
    const name = (id: string) => cloudState.printers.find(p => p.id === id)?.name ?? 'a printer'
    return (accountState.events ?? []).slice(0, 3).map(e => {
      const line = eventLine(e, name)
      return { id: e.id, icon: EVENT_ICONS[line.icon] ?? 'alert', text: line.text, when: whenText(e.at) }
    })
  }
}
</script>

<style lang="scss" scoped>
  .acct-deleting {
    align-items: center;

    > span {
      flex: 1 1 auto;
    }
  }

  .acct-plan {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;
    color: var(--m3d-text) !important;
    text-decoration: none;
  }

  .grow {
    flex: 1 1 auto;
  }
</style>
