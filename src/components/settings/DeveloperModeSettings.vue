<template>
  <section
    id="developer"
    class="devm"
    data-tid="developer-mode"
  >
    <header class="devm__head">
      <div class="devm__titles">
        <h2>Developer mode</h2>
        <p>{{ stateLine }}</p>
      </div>
      <toggle-switch
        :value="!!state.enabled"
        label="Developer mode"
        :disabled="!state.canManage || state.enabled === null || busy"
        data-tid="developer-mode-switch"
        @input="toggle"
      />
    </header>

    <p class="devm__text">
      Lets you change this printer's own configuration and macros. The Muon3D defaults stay as they are beside your copy, and turning it off goes back to them (your copy is kept for next time).
    </p>

    <p
      v-if="!state.canManage && state.enabled !== null"
      class="devm__note"
    >
      This browser can see developer mode but not change it. Change it from the printer's own network, or as its owner.
    </p>

    <div
      class="devm__fuse"
      :class="`devm__fuse--${fuseTone}`"
      data-tid="developer-mode-fuse"
    >
      <frame-icon
        :name="fuseTone === 'warn' ? 'alert' : 'check'"
        small
      />
      <span>{{ fuseText }}</span>
    </div>

    <template v-if="state.enabled">
      <div class="devm__actions">
        <router-link
          :to="macrosTo"
          class="cbtn"
          data-tid="developer-edit-macros"
        >
          Edit macros
        </router-link>
        <router-link
          :to="filesTo"
          class="cbtn"
        >
          Open the config files
        </router-link>
        <button
          type="button"
          class="cbtn cbtn--ghost"
          :disabled="busy"
          @click="backupConfig"
        >
          Back up the config
        </button>
        <button
          type="button"
          class="cbtn cbtn--ghost"
          :disabled="busy"
          @click="restoreDefaults"
        >
          Start again from the Muon3D defaults
        </button>
      </div>
    </template>

    <v-dialog
      v-model="enableDialog"
      max-width="560"
      :persistent="awaiting"
    >
      <div
        class="devm__dialog"
        data-tid="developer-enable-dialog"
      >
        <h3>Turn on developer mode</h3>
        <p>{{ $t('app.general.dev_mode.modal-1') }}</p>
        <template v-if="waiverText">
          <b>{{ $t('app.general.dev_mode.modal-warranty-liability') }}</b>
          <p class="devm__waiver">
            {{ waiverText }}
          </p>
          <label class="devm__accept">
            <input
              v-model="accepted"
              type="checkbox"
              :disabled="awaiting"
            >
            {{ $t('app.general.dev_mode.modal-checkbox-message') }}
          </label>
        </template>
        <p
          v-else-if="waiverError"
          class="devm__error"
        >
          {{ $t('app.general.dev_mode.waiver-unavailable') }} {{ waiverError }}
        </p>
        <p
          v-else
          class="devm__text"
        >
          Reading the printer's terms…
        </p>
        <div
          v-if="awaiting"
          class="devm__press"
          data-tid="developer-press-knob"
        >
          <span class="devm__pulse" />
          <div>
            <b>{{ consentInstruction || 'Press the knob on the printer to confirm.' }}</b>
            <span>{{ $t('app.general.dev_mode.consent-expires', { seconds: secondsRemaining }) }}</span>
          </div>
        </div>
        <p
          v-if="errorMessage"
          class="devm__error"
        >
          {{ errorMessage }}
        </p>
        <div class="devm__buttons">
          <button
            type="button"
            class="cbtn cbtn--ghost"
            :disabled="loading"
            @click="closeEnable"
          >
            {{ $t('app.general.btn.cancel') }}
          </button>
          <button
            type="button"
            class="cbtn cbtn--primary"
            :disabled="!accepted || !waiverText || loading || awaiting"
            data-tid="developer-enable"
            @click="confirmEnable"
          >
            Turn on
          </button>
        </div>
      </div>
    </v-dialog>

    <v-dialog
      v-model="disableDialog"
      max-width="480"
    >
      <div class="devm__dialog">
        <h3>Turn off developer mode</h3>
        <p>{{ $t('app.general.dev_mode.disable-modal-1') }}</p>
        <p>{{ $t('app.general.dev_mode.disable-modal-2') }}</p>
        <p
          v-if="errorMessage"
          class="devm__error"
        >
          {{ errorMessage }}
        </p>
        <div class="devm__buttons">
          <button
            type="button"
            class="cbtn cbtn--ghost"
            :disabled="loading"
            @click="disableDialog = false"
          >
            {{ $t('app.general.btn.cancel') }}
          </button>
          <button
            type="button"
            class="cbtn cbtn--primary"
            :disabled="loading"
            data-tid="developer-disable"
            @click="confirmDisable"
          >
            Turn off
          </button>
        </div>
      </div>
    </v-dialog>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import consola from 'consola'
import { useAuxApi } from '@/aux_api/useAuxApi'
import { devModeState, refreshDevMode } from '@/services/dev-mode/state'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'

/** How often the browser asks whether the knob has been pressed yet. */
const CONSENT_POLL_MS = 1500

/**
 * Settings › Developer mode: whether it's on, a switch to change it, and
 * whether turning it on marks the printer for good (the OTP fuse, which the
 * development fleet ships disarmed). Turning it on takes the printer's own
 * waiver and a press of the knob at the printer (KAN-465); turning it off
 * is one press here. With it on: edit macros, open the config, back it up,
 * or start again from the defaults.
 */
@Component({ components: { ToggleSwitch } })
export default class DeveloperModeSettings extends Vue {
  api = useAuxApi().devMode
  state = devModeState

  enableDialog = false
  disableDialog = false
  accepted = false
  loading = false
  waiverText = ''
  waiverVersion: string | null = null
  waiverError = ''
  challengeId: string | null = null
  consentInstruction = ''
  secondsRemaining = 0
  awaiting = false
  errorMessage = ''
  pollTimer: number | null = null
  countdownTimer: number | null = null

  mounted () {
    refreshDevMode()
  }

  beforeDestroy () {
    this.stopWaiting()
  }

  get busy (): boolean {
    return this.loading || this.awaiting
  }

  get stateLine (): string {
    if (this.state.enabled === null) return 'Asking the printer…'
    if (this.state.enabled) return 'On: the printer runs your copy of its configuration'
    return 'Off: the printer runs the Muon3D configuration'
  }

  get fuseTone (): 'ok' | 'warn' | 'unknown' {
    if (this.state.otpArmed === false) return 'ok'
    if (this.state.otpArmed === true) return 'warn'
    return 'unknown'
  }

  get fuseText (): string {
    if (this.state.otpArmed === false) {
      return 'Not recorded on this printer: its fuse is disarmed, so you can turn developer mode on and off freely to try it.'
    }
    if (this.state.otpArmed === true) {
      return 'Turning it on is recorded on this printer for good, in a fuse that no update or reset clears. It can affect the warranty.'
    }
    return 'This printer doesn\'t say whether turning it on is recorded for good.'
  }

  get macrosTo (): string {
    return `${scopedPath('/settings', activeSlug())}#macros`
  }

  get filesTo (): string {
    return scopedPath('/configure', activeSlug())
  }

  /** The printer's own words for a failure, in preference to ours. */
  describe (err: unknown): string {
    const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (detail && typeof (detail as { message?: unknown }).message === 'string') return (detail as { message: string }).message
    const message = (err as { message?: unknown })?.message
    return typeof message === 'string' ? message : String(err)
  }

  async toggle () {
    if (!this.state.canManage || this.busy) return
    this.errorMessage = ''
    if (this.state.enabled) {
      this.disableDialog = true
    } else if (!this.state.guardArmed) {
      await this.setEnabled(true)
    } else {
      this.accepted = false
      this.enableDialog = true
      await this.loadWaiver()
    }
  }

  /** DEV-2: the waiver shown is the one the printer serves now, never a copy. */
  async loadWaiver () {
    this.waiverText = ''
    this.waiverError = ''
    try {
      const { data } = await this.api.getDevModeWaiverDevModeWaiverGet()
      if (!data?.text || !data?.version) throw new Error('the printer returned an empty waiver')
      this.waiverText = data.text
      this.waiverVersion = data.version
    } catch (err) {
      consola.error('Failed to load the developer-mode waiver:', err)
      this.waiverError = this.describe(err)
    }
  }

  closeEnable () {
    this.stopWaiting()
    this.enableDialog = false
    this.errorMessage = ''
  }

  stopWaiting () {
    if (this.pollTimer !== null) window.clearInterval(this.pollTimer)
    if (this.countdownTimer !== null) window.clearInterval(this.countdownTimer)
    this.pollTimer = null
    this.countdownTimer = null
    this.awaiting = false
    this.challengeId = null
  }

  /** Opens the printer's challenge, waits for the knob, then redeems it with the accepted waiver. */
  async confirmEnable () {
    this.errorMessage = ''
    this.loading = true
    let challenge
    try {
      const { data } = await this.api.openDevModeConsentDevModeConsentPost()
      challenge = data
    } catch (err) {
      this.loading = false
      this.errorMessage = this.describe(err)
      return
    }
    this.loading = false
    this.challengeId = challenge.challenge_id
    this.consentInstruction = challenge.instruction
    this.secondsRemaining = Math.max(0, Math.round(challenge.expires_in_seconds))
    this.awaiting = true
    this.countdownTimer = window.setInterval(() => {
      this.secondsRemaining = Math.max(0, this.secondsRemaining - 1)
      if (this.secondsRemaining === 0) {
        this.stopWaiting()
        this.errorMessage = this.$t('app.general.dev_mode.consent-expired') as string
      }
    }, 1000)
    this.pollTimer = window.setInterval(() => { this.pollConsent().catch(() => undefined) }, CONSENT_POLL_MS)
  }

  async pollConsent () {
    const id = this.challengeId
    if (!id) return
    try {
      const { data } = await this.api.getDevModeConsentDevModeConsentChallengeIdGet(id)
      if (!data?.confirmed) return
    } catch {
      return
    }
    this.stopWaiting()
    this.loading = true
    try {
      await this.api.setDevModeDevModePost({ enabled: true, waiver_acknowledged: true, waiver_version: this.waiverVersion, challenge_id: id })
      this.enableDialog = false
    } catch (err) {
      this.errorMessage = this.describe(err)
    } finally {
      this.loading = false
      await refreshDevMode()
    }
  }

  async setEnabled (enabled: boolean) {
    this.loading = true
    try {
      await this.api.setDevModeDevModePost({ enabled })
      this.disableDialog = false
    } catch (err) {
      this.errorMessage = this.describe(err)
      if (!this.disableDialog) this.notify(enabled ? 'Turn on developer mode' : 'Turn off developer mode', err)
    } finally {
      this.loading = false
      await refreshDevMode()
    }
  }

  confirmDisable () {
    this.errorMessage = ''
    return this.setEnabled(false)
  }

  async restoreDefaults () {
    const ok = await this.$confirm('Your copy of the configuration is backed up, then replaced with the Muon3D defaults, and Klipper restarts.', {
      title: 'Start again from the defaults?',
      buttonTrueText: 'Back up and replace',
      danger: true
    })
    if (!ok) return
    this.loading = true
    try {
      await this.api.refreshDevModeConfigDevModeRefreshPost()
    } catch (err) {
      this.notify('Start again from the defaults', err)
    } finally {
      this.loading = false
    }
  }

  async backupConfig () {
    this.loading = true
    try {
      await this.api.manualBackupDevModeBackupPost()
      this.$store.dispatch('notifications/pushNotification', { title: 'Config backed up', description: 'In the config folder, under backups.', type: 'success' })
    } catch (err) {
      this.notify('Back up the config', err)
    } finally {
      this.loading = false
    }
  }

  notify (title: string, err: unknown) {
    this.$store.dispatch('notifications/pushNotification', { title, description: this.describe(err), type: 'error' })
  }
}
</script>

<style lang="scss" scoped>
  .devm {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 20px;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
  }

  .devm__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .devm__titles {
    h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
    }

    p {
      margin: 2px 0 0;
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .devm__text,
  .devm__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .devm__fuse {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--m3d-surface-2);
    font-size: 13px;
  }

  .devm__fuse--ok {
    color: var(--m3d-success, #57c08a);
  }

  .devm__fuse--warn {
    color: var(--m3d-warning, #e8963c);
  }

  .devm__fuse--unknown {
    color: var(--m3d-text-muted);
  }

  .devm__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .devm__dialog {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 22px;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);

    h3 {
      margin: 0;
      font-size: 18px;
    }

    p {
      margin: 0;
      color: var(--m3d-text-muted);
      font-size: 14px;
    }
  }

  .devm__waiver {
    max-height: 220px;
    overflow: auto;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--m3d-surface-2);
    white-space: pre-wrap;
  }

  .devm__accept {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 14px;
    cursor: pointer;

    input {
      margin-top: 3px;
    }
  }

  .devm__press {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 12px;
    background: var(--m3d-surface-2);

    div {
      display: flex;
      flex-direction: column;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .devm__pulse {
    flex: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--m3d-accent);
    animation: devm-pulse 1.2s ease-in-out infinite;
  }

  @keyframes devm-pulse {
    50% { box-shadow: 0 0 0 8px rgb(128 214 209 / 0%); opacity: 0.5; }
  }

  .devm__error {
    color: var(--m3d-danger) !important;
  }

  .devm__buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
</style>
