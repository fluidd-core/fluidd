<template>
  <div
    class="acct-section"
    data-tid="account-sessions"
  >
    <div class="acct-head acct-head--row">
      <div class="acct-head">
        <h1>Devices and sessions</h1>
        <p>Everywhere you're signed in. Signing a device out also ends any remote connection it has open to your printers. Prints carry on.</p>
      </div>
      <button
        v-if="others.length && !everywhereMissing"
        type="button"
        class="lib-btn"
        :disabled="busy"
        data-tid="sessions-everywhere-else"
        @click="signOutOthers"
      >
        <frame-icon
          name="logout"
          small
        />Sign out everywhere else
      </button>
    </div>

    <section
      class="lib-surface acct-card"
      aria-label="Signed in"
    >
      <p
        v-if="!devices"
        class="acct-muted sess__reading"
      >
        Reading your devices…
      </p>
      <div
        v-else
        class="acct-list"
      >
        <div
          v-for="device in devices"
          :key="device.id"
          class="sess__device"
          :data-tid="device.current ? 'sessions-this-device' : 'sessions-device'"
        >
          <span
            class="acct-icon-box"
            :class="{ 'sess__icon--here': device.current }"
          ><frame-icon
            :name="iconOf(device)"
            small
          /></span>
          <div class="acct-row__label">
            <span class="sess__name">
              <b>{{ device.label }}</b>
              <span
                v-if="device.current"
                class="lib-pill lib-pill--run"
              >This browser</span>
              <span
                v-else-if="isNew(device)"
                class="lib-pill sess__new"
              >New</span>
            </span>
            <span>{{ detail(device) }}</span>
          </div>
          <button
            type="button"
            class="lib-btn lib-btn--sm lib-btn--ghost"
            :disabled="busy"
            @click="signOutDevice(device)"
          >
            Sign out
          </button>
        </div>
      </div>
    </section>
    <div
      v-if="devices && !others.length"
      class="acct-empty"
      data-tid="sessions-empty"
    >
      <span class="acct-empty__icon acct-empty__icon--good"><frame-icon
        name="monitor"
        large
      /></span>
      <h3>Only this browser is signed in</h3>
      <p>Get print alerts and reach your printers away from home with the Muon3D app.</p>
    </div>
    <span class="acct-field__note sess__aside">A device that hasn't been used for 30 days is signed out by itself.</span>

    <section
      class="lib-surface acct-card"
      aria-label="Activity"
      data-tid="sessions-activity"
    >
      <div class="acct-card__title">
        <h2>Activity</h2>
        <span class="acct-card__aside">The last 90 days</span>
      </div>
      <div class="acct-list">
        <div
          v-for="item in shownEvents"
          :key="item.id"
          class="sess__event"
        >
          <frame-icon
            :name="item.icon"
            small
            class="acct-muted"
          />
          <span>{{ item.text }}</span>
          <span class="acct-lrow__time">{{ item.when }}</span>
        </div>
        <p
          v-if="events && !events.length"
          class="acct-muted sess__reading"
        >
          Nothing yet.
        </p>
      </div>
      <div
        v-if="events && events.length > shown"
        class="sess__more"
      >
        <button
          type="button"
          class="lib-btn lib-btn--sm lib-btn--ghost"
          @click="shown += 10"
        >
          Show older
        </button>
      </div>
    </section>

    <div class="acct-note acct-note--warn">
      <frame-icon
        name="alert"
        small
      />
      <span>Don't recognise something? Sign that device out, then <router-link
        :to="linkTo('security')"
        class="acct-link"
      >change your password</router-link>. Changing it signs out everything except this browser.</span>
    </div>

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
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { cloudState } from '@/services/muon-cloud/state'
import { accountApi } from '@/services/account/api'
import { AccountError, isMissing } from '@/services/account/client'
import { accountState, describe, loadEvents, loadSessions } from '@/services/account/state'
import { agoText, devicesFrom, eventLine, whenText, type AccountSectionId, type Device } from '@/services/account/model'
import { beginSignOut } from '@/services/account/sign-out'

const EVENT_ICONS: Record<string, string> = {
  signIn: 'signIn', signOut: 'logout', key: 'key', shield: 'shield', userPlus: 'userPlus', userMinus: 'userMinus', mail: 'mail', lock: 'lock', alert: 'alert', link: 'link'
}

/** Signed in for less than this, and not this browser: "New". */
const NEW_FOR_S = 3 * 86400

/**
 * Devices and sessions (the canvas's "Account · Devices and sessions"):
 * each device once, with what it uses and when it was last used, signing
 * one out or all the others, and the account's history.
 */
@Component({})
export default class AccountSessions extends Vue {
  @Prop({ type: Function, required: true })
  readonly linkTo!: (id: AccountSectionId) => string

  busy = false
  error = ''
  message = ''
  shown = 8
  everywhereMissing = false

  created () {
    this.refresh()
  }

  refresh () {
    loadSessions().catch(() => {})
    loadEvents().catch(() => {})
  }

  get devices (): Device[] | null {
    return accountState.sessions ? devicesFrom(accountState.sessions) : null
  }

  get others (): Device[] {
    return (this.devices ?? []).filter(d => !d.current)
  }

  get events () {
    return accountState.events
  }

  get shownEvents () {
    const name = (id: string) => cloudState.printers.find(p => p.id === id)?.name ?? 'a printer'
    const devices = this.devices ?? []
    return (this.events ?? []).slice(0, this.shown).map(e => {
      const line = eventLine(e, name)
      const session = typeof e.detail?.session_id === 'string' ? devices.find(d => d.sessionIds.includes(e.detail.session_id as string)) : undefined
      return { id: e.id, icon: EVENT_ICONS[line.icon] ?? 'alert', text: session ? `${line.text} · ${session.label}` : line.text, when: whenText(e.at) }
    })
  }

  iconOf (device: Device): string {
    if (device.kind === 'phone') return 'phone'
    return /mac|laptop/i.test(device.label) ? 'laptop' : 'monitor'
  }

  isNew (device: Device): boolean {
    return !device.leftover && Date.now() / 1000 - device.signedInAt < NEW_FOR_S
  }

  detail (device: Device): string {
    const parts: string[] = []
    if (device.uses) parts.push(device.uses)
    if (device.phoneKey) parts.push(`phone key ${device.phoneKey}`)
    parts.push(`signed in ${whenText(device.signedInAt)}`)
    const used = agoText(device.lastUsedAt)
    parts.push(device.current ? 'active now' : used === 'now' ? 'active now' : `active ${used}`)
    return parts.join(' · ')
  }

  async signOutDevice (device: Device) {
    if (device.current) {
      beginSignOut(this.$router)
      return
    }
    this.busy = true
    this.error = ''
    this.message = ''
    try {
      await accountApi.endDevice(device.id).catch((error) => {
        // Already ended by another device. A missing route is an upgrade gap.
        if (!(error instanceof AccountError && error.status === 404 && !isMissing(error))) throw error
      })
      this.message = `${device.label} is signed out.`
    } catch (error) {
      this.error = describe(error)
    } finally {
      this.busy = false
      this.refresh()
    }
  }

  async signOutOthers () {
    const sure = await this.$confirm(`${this.others.length === 1 ? this.others[0].label : `${this.others.length} devices`} will be signed out at once, the Muon3D app on your phone included. This browser stays signed in.`, {
      title: 'Sign out everywhere else?',
      buttonTrueText: 'Sign them out'
    })
    if (!sure) return
    this.busy = true
    this.error = ''
    this.message = ''
    try {
      await accountApi.endSessions('others')
      this.message = 'Every other device is signed out.'
    } catch (error) {
      if (isMissing(error)) {
        this.everywhereMissing = true
        this.message = 'Signing every other device out at once comes soon. Until then, sign them out one by one above.'
      } else {
        this.error = describe(error)
      }
    } finally {
      this.busy = false
      this.refresh()
    }
  }
}
</script>

<style lang="scss" scoped>
  .sess__device {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    padding: 14px 0;
  }

  .sess__icon--here {
    background: var(--m3d-accent-soft);
    color: var(--m3d-accent);
  }

  .sess__name {
    display: flex !important;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    color: var(--m3d-text) !important;
    font-size: 14px !important;
  }

  .sess__new {
    background: color-mix(in srgb, var(--m3d-accent) 14%, transparent);
    color: var(--m3d-accent);
  }

  .sess__aside {
    margin-top: -6px;
  }

  .sess__event {
    display: grid;
    grid-template-columns: 20px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 10px 0;
    font-size: 13px;
  }

  .sess__more {
    display: flex;
    justify-content: center;
    padding: 6px 0 14px;
  }

  .sess__reading {
    margin: 0;
    padding: 14px 0;
    font-size: 13px;
  }

  @media (max-width: 480px) {
    .sess__device {
      grid-template-columns: 40px minmax(0, 1fr);
    }
    .sess__device > button {
      grid-column: 2;
      justify-self: start;
    }
    .sess__event {
      grid-template-columns: 20px minmax(0, 1fr);
    }
    .acct-lrow__time {
      grid-column: 2;
    }
  }
</style>
