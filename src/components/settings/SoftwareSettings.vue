<template>
  <div
    id="versions"
    class="soft"
    data-tid="software-settings"
  >
    <section
      class="soft__panel"
      data-tid="software-printer"
    >
      <header class="soft__head">
        <div class="soft__titles">
          <h2>{{ printerName }}'s software</h2>
          <p>MuonOS: the printer's system, Klipper, its screen and this page, updated together.</p>
        </div>
        <span
          class="soft__chip"
          :class="`soft__chip--${chip.tone}`"
          data-tid="software-state"
        >{{ chip.text }}</span>
      </header>

      <p
        v-if="!status"
        class="soft__note"
      >
        {{ unavailableText }}
      </p>

      <template v-else>
        <dl class="soft__facts">
          <div>
            <dt>Installed</dt>
            <dd data-tid="software-installed">
              {{ installed }}
            </dd>
          </div>
          <div v-if="available">
            <dt>Ready to install</dt>
            <dd data-tid="software-available">
              {{ availableText }}
            </dd>
          </div>
          <div>
            <dt>Last checked</dt>
            <dd>{{ checkedText }}</dd>
          </div>
        </dl>

        <div
          v-if="active"
          class="soft__progress"
        >
          <span class="soft__bar"><i :style="{ width: `${progress ?? 0}%` }" /></span>
          <router-link
            :to="updatingTo"
            class="soft__link"
          >
            See progress
          </router-link>
        </div>

        <p
          v-if="outcomeText"
          class="soft__note soft__note--warn"
          data-tid="software-outcome"
        >
          {{ outcomeText }}
        </p>

        <details
          v-if="available && status.release_notes"
          class="soft__notes"
        >
          <summary>What's new</summary>
          <p>{{ status.release_notes }}</p>
        </details>

        <p
          v-if="available"
          class="soft__note"
        >
          Installing takes 10 to 40 minutes over Wi-Fi. The printer keeps working while the new version is written, then restarts for a few minutes. Not while printing.
        </p>

        <div class="soft__actions">
          <button
            v-if="available"
            type="button"
            class="cbtn cbtn--primary"
            :disabled="!canInstall"
            :title="installBlocked"
            data-tid="software-install"
            @click="install"
          >
            Install the update
          </button>
          <button
            type="button"
            class="cbtn"
            :disabled="checking || active"
            data-tid="software-check"
            @click="check"
          >
            {{ checking ? 'Checking…' : 'Check now' }}
          </button>
          <span
            v-if="installBlocked && available"
            class="soft__why"
          >{{ installBlocked }}</span>
        </div>
        <p
          v-if="installRefusal"
          class="soft__note soft__note--warn"
          data-tid="software-install-refusal"
        >
          {{ installRefusal }}
        </p>
      </template>
    </section>

    <section class="soft__panel">
      <div class="soft__row">
        <div class="soft__titles">
          <h3>Tell me when an update is ready</h3>
          <p>A notice in the bell at the top.</p>
        </div>
        <toggle-switch
          :value="enableNotifications"
          label="Tell me when an update is ready"
          @input="enableNotifications = $event"
        />
      </div>
    </section>

    <task-fold
      v-if="others.length"
      v-model="otherSoftwareOpen"
      fold-id="settings-other-software"
      title="Other software"
      summary="What else this printer's updater looks after"
      class="soft__panel"
      data-tid="software-others"
    >
      <div
        v-for="c in others"
        :key="c.key"
        class="soft__row"
      >
        <div class="soft__titles">
          <h3>{{ c.title }}</h3>
          <p>{{ c.text }}</p>
        </div>
        <button
          v-if="c.update"
          type="button"
          class="cbtn"
          :disabled="busy || !!otherUpdateBlocked"
          :title="otherUpdateBlocked"
          @click="updateOther(c.key)"
        >
          Update
        </button>
      </div>
    </task-fold>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import TypedCommandsMixin from '@/mixins/typed-commands'
import { SocketActions } from '@/api/socketActions'
import { ACTIVE_PHASES, versionLabel } from '@/services/updates/model'
import { currentOutcome, installStarted, poll, updateWatch } from '@/services/updates/watch'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'
import { printerNameParts } from '@/util/printer-name'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import TaskFold from '@/components/control/TaskFold.vue'

interface OtherComponent {
  key: string;
  title: string;
  text: string;
  update: boolean;
}

/**
 * Settings › Updates: the printer's own software (MuonOS) as the printer's
 * Aux API reports it: what's installed, what's ready, when it last looked,
 * and Install, which opens the Updating page. Moonraker's update row for
 * MuonOS shows "?" for its versions (OtaDeploy), so this reads the Aux API.
 * Whatever else the updater looks after is available in a nearby fold.
 */
@Component({ components: { ToggleSwitch, TaskFold } })
export default class SoftwareSettings extends Mixins(TypedCommandsMixin) {
  checking = false
  otherSoftwareOpen = false
  installRefusal = ''

  mounted () {
    poll()
  }

  get printerName (): string {
    return printerNameParts(this.$store.getters['config/getDisplayName'] as string).name
  }

  get status () {
    return updateWatch.status
  }

  get locked (): boolean {
    return this.$store.getters['protection/isLocked'] as boolean
  }

  get unavailableText (): string {
    if (this.locked) return 'Network protection is on, so updates are only managed from the printer\'s panel or a device paired with it.'
    return 'Asking the printer…'
  }

  get remembered () {
    return updateWatch.remembered
  }

  get active (): boolean {
    return !!this.remembered && ACTIVE_PHASES.includes(this.remembered.phase)
  }

  get progress (): number | null {
    const p = this.remembered?.progress ?? this.status?.progress ?? null
    return typeof p === 'number' ? Math.round(Math.max(0, Math.min(100, p))) : null
  }

  get available (): boolean {
    return !!this.status?.update_available && !!this.status.target_version && this.status.target_version !== this.status.current_version
  }

  get installed (): string {
    return versionLabel(this.status?.current_version).text
  }

  get availableText (): string {
    return versionLabel(this.status?.target_version).text
  }

  get checkedText (): string {
    const at = this.status?.last_checked ? Date.parse(this.status.last_checked) : NaN
    if (!Number.isFinite(at)) return 'not yet'
    const minutes = Math.round((Date.now() - at) / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.round(minutes / 60)
    return hours < 48 ? `${hours} h ago` : `${Math.round(hours / 24)} days ago`
  }

  get chip (): { text: string, tone: string } {
    if (!this.status) return { text: '…', tone: 'muted' }
    const phase = this.remembered?.phase
    if (phase === 'installing') return { text: this.progress !== null ? `Updating · ${this.progress}%` : 'Updating', tone: 'busy' }
    if (phase === 'preparing') return { text: 'Starting the update', tone: 'busy' }
    if (phase === 'rebooting') return { text: 'Restarting', tone: 'busy' }
    if (phase === 'verifying' || this.status.requires_commit) return { text: 'Checking the update', tone: 'busy' }
    if (this.available) return { text: 'Update ready', tone: 'warn' }
    return { text: 'Up to date', tone: 'ok' }
  }

  get outcomeText (): string {
    const o = currentOutcome()
    const message = this.status?.session?.error?.message
    if (o === 'rolled_back') return `The last update didn't complete, so the printer went back to the version it had.${message ? ` ${message}` : ''}`
    if (o === 'failed') return `The last update didn't install; nothing changed.${message ? ` ${message}` : ''}`
    if (this.status?.state === 'failed' && this.status.error) return this.status.error
    return ''
  }

  get installBlocked (): string {
    if (!this.commandControlAvailable) return 'Connect to a printer you can control first.'
    if (!this.klippyConnected) return 'Klipper is not connected.'
    if (this.printerBusy) return 'Not while printing.'
    if (this.active) return 'An update is already under way.'
    if (this.status?.requires_commit) return 'The printer is still checking the last update.'
    return ''
  }

  get canInstall (): boolean {
    return this.available && !this.installBlocked && this.klippyConnected
  }

  get updatingTo (): string {
    return scopedPath('/updating', activeSlug())
  }

  /** The updater's name for MuonOS: the component of type ota. */
  get otaKey (): string {
    const info = (this.$store.state.version.version_info ?? {}) as Record<string, { configured_type?: string }>
    return Object.keys(info).find(k => info[k]?.configured_type === 'ota') ?? 'MuonOS'
  }

  async install () {
    this.installRefusal = this.installBlocked
    if (!this.canInstall) return
    this.installRefusal = ''
    const target = this.commandTarget
    const component = this.otaKey
    const fromVersion = this.status?.current_version ?? null
    const toVersion = this.status?.target_version ?? null
    const ok = await this.$confirm(
      `${this.printerName} writes the new version while it keeps working, then restarts into it, which takes a few minutes. Don't turn it off until it is back.`,
      { title: 'Install the update now?', buttonTrueText: 'Install', buttonFalseText: 'Not now' }
    )
    if (!ok) return
    if (target !== this.commandTarget) this.installRefusal = 'Not sent. The selected printer or account changed. Try again.'
    else if (component !== this.otaKey) this.installRefusal = 'Not sent. The update component changed. Check again.'
    else if (fromVersion !== (this.status?.current_version ?? null) || toVersion !== (this.status?.target_version ?? null)) this.installRefusal = 'Not sent. The available version changed. Check again.'
    else if (!this.available || this.installBlocked) this.installRefusal = `Not sent. ${this.installBlocked || 'The update is no longer available.'}`
    if (this.installRefusal) return
    SocketActions.machineUpdateClient(component)
    installStarted(fromVersion, toVersion)
    this.$router.push(this.updatingTo).catch(() => undefined)
  }

  async check () {
    this.checking = true
    try {
      SocketActions.machineUpdateRefresh(this.otaKey)
      await new Promise(resolve => setTimeout(resolve, 3000))
      await poll()
    } finally {
      this.checking = false
    }
  }

  get enableNotifications (): boolean {
    return this.$store.state.config.uiSettings.general.enableVersionNotifications
  }

  set enableNotifications (value: boolean) {
    this.$store.dispatch('config/saveByPath', { path: 'uiSettings.general.enableVersionNotifications', value, server: true })
  }

  get busy (): boolean {
    return !!this.$store.state.version.busy
  }

  get otherUpdateBlocked (): string {
    if (!this.commandControlAvailable) return 'Connect to a printer you can control first.'
    if (!this.klippyConnected) return 'Klipper is not connected.'
    if (this.printerBusy) return 'Not while printing.'
    return ''
  }

  /** Everything else the updater lists: the OS packages and any other client. */
  get others (): OtherComponent[] {
    const info = (this.$store.state.version.version_info ?? {}) as Record<string, Record<string, unknown>>
    const hasUpdate = this.$store.getters['version/hasUpdate'] as (key: string) => boolean
    return Object.entries(info)
      .filter(([, c]) => c.configured_type !== 'ota')
      .map(([key, c]) => {
        const update = hasUpdate(key)
        if (key === 'system') {
          const n = Number(c.package_count ?? 0)
          return { key, title: 'The system\'s packages', text: n ? `${n} to update` : 'Up to date', update }
        }
        const version = String(c.version ?? c.full_version_string ?? '')
        const remote = String(c.remote_version ?? '')
        return { key, title: key, text: update ? `${version} → ${remote}` : version || 'Up to date', update }
      })
  }

  async updateOther (key: string) {
    if (this.otherUpdateBlocked) return
    const target = this.commandTarget
    const ok = await this.$confirm('The printer must be idle. It may restart after this component is updated.', {
      title: `Update ${key}?`, buttonTrueText: 'Update', buttonFalseText: 'Not now'
    })
    if (!ok || target !== this.commandTarget || this.otherUpdateBlocked) return
    this.$store.dispatch('version/onUpdateStatus', { busy: true })
    if (key === 'system') SocketActions.machineUpdateSystem()
    else SocketActions.machineUpdateClient(key)
  }
}
</script>

<style lang="scss" scoped>
  .soft {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .soft__panel {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 20px;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
  }

  .soft__head,
  .soft__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .soft__row + .soft__row {
    padding-top: 12px;
    border-top: 1px solid var(--m3d-border);
  }

  .soft__titles {
    min-width: 0;

    h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
    }

    h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
    }

    p {
      margin: 2px 0 0;
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .soft__chip {
    flex: none;
    padding: 4px 12px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    font-size: 13px;
    font-weight: 600;
  }

  .soft__chip--ok { color: var(--m3d-success, #57c08a); }
  .soft__chip--warn { color: var(--m3d-warning, #e8963c); }
  .soft__chip--busy { color: var(--m3d-accent); }
  .soft__chip--muted { color: var(--m3d-text-subtle); }

  .soft__facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 10px;
    margin: 0;

    div {
      padding: 10px 12px;
      border-radius: 14px;
      background: var(--m3d-surface-2);
    }

    dt {
      color: var(--m3d-text-muted);
      font-size: 12px;
    }

    dd {
      margin: 2px 0 0;
      font-size: 15px;
      font-weight: 600;
    }
  }

  .soft__progress {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .soft__bar {
    flex: 1 1 auto;
    height: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--m3d-surface-2);

    i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--m3d-accent);
      transition: width 0.6s var(--m3d-ease, ease);
    }
  }

  .soft__link {
    color: var(--m3d-accent) !important;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
  }

  .soft__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .soft__note--warn {
    color: var(--m3d-warning, #e8963c);
  }

  .soft__notes {
    padding: 10px 12px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
    font-size: 14px;

    summary {
      cursor: pointer;
      font-weight: 600;
    }

    p {
      margin: 8px 0 0;
      white-space: pre-wrap;
    }
  }

  .soft__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .soft__why {
    color: var(--m3d-text-subtle);
    font-size: 13px;
  }
</style>
