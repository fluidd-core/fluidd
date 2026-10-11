<template>
  <section
    class="hs"
    data-tid="hotspot-card"
  >
    <header class="hs__head">
      <div class="hs__titles">
        <h2>The printer's hotspot</h2>
        <p v-if="deviceStatus && apCredentials && !locked && !remote">
          {{ apState ? 'On' : 'Off' }} · {{ apCredentials.ssid }}{{ apCredentials.security_enabled === false ? ' · open' : '' }}
        </p>
      </div>
      <toggle-switch
        v-if="!remote"
        :value="apState"
        label="Hotspot on"
        :disabled="locked || !apCredentials || !deviceStatus || toggling"
        data-tid="hotspot-switch"
        @input="requestToggle()"
      />
    </header>

    <protected-notice />
    <p
      v-if="remote"
      class="hs__note"
    >
      {{ $t('app.wifi.remote_read_only') }}
    </p>

    <div
      v-if="!locked && !remote"
      class="hs__body"
      data-tid="hotspot-body"
    >
      <p
        v-if="!apCredentials"
        class="hs__note"
      >
        Reading the hotspot's settings…
      </p>
      <v-form
        v-else
        ref="apForm"
        v-model="formIsValid"
        :disabled="!editing || applying"
        lazy-validation
        class="hs__form"
        @submit.prevent="requestApplyChanges"
      >
        <v-text-field
          v-model="form.ssid"
          label="Name (SSID)"
          outlined
          dense
          hide-details="auto"
          :rules="ssidRules"
        />
        <div class="hs__row">
          <span>Needs a password</span>
          <toggle-switch
            :value="form.securityEnabled"
            label="Needs a password"
            :disabled="!editing || applying"
            data-tid="hotspot-secured"
            @input="form.securityEnabled = $event"
          />
        </div>
        <v-text-field
          ref="passwordInput"
          v-model="form.password"
          :label="$t('app.general.label.password')"
          :type="passwordVisible ? 'text' : 'password'"
          :append-icon="passwordVisible ? '$eyeOff' : '$eye'"
          :rules="passwordRules"
          outlined
          dense
          hide-details="auto"
          :disabled="!form.securityEnabled || !editing || applying"
          @click:append.stop="passwordVisible = !passwordVisible"
        />
        <div class="hs__buttons">
          <button
            v-if="!editing"
            type="button"
            class="cbtn"
            :disabled="toggling || applying"
            data-tid="hotspot-edit"
            @click="toggleEditing"
          >
            Change the name or password
          </button>
          <template v-else>
            <button
              type="submit"
              class="cbtn cbtn--primary"
              :disabled="!isDirty || !formIsValid || applying"
              data-tid="hotspot-apply"
            >
              {{ $t('app.wifi.change') }}
            </button>
            <button
              type="button"
              class="cbtn cbtn--ghost"
              :disabled="applying"
              @click.stop="undoChanges"
            >
              {{ isDirty ? 'Undo' : 'Back' }}
            </button>
          </template>
        </div>
      </v-form>

      <div
        v-if="apCredentials && apState && !editing"
        class="hs__join"
      >
        <template v-if="QrValue">
          <qrcode-vue
            class="hs__qr"
            :value="QrValue"
            :size="120"
            render-as="svg"
          />
          <p>Scan to join the hotspot.</p>
        </template>
        <p v-else>
          {{ $t('app.wifi.hotspot_code_on_printer', { name: printerName }) }}
        </p>
      </div>
    </div>

    <v-dialog
      v-model="showToggleWarningDialog"
      max-width="420"
    >
      <div class="hs__dialog">
        <h3>{{ $t('app.wifi.modal.warning.title') }}</h3>
        <p>{{ $t('app.wifi.modal.warning.message') }}</p>
        <div class="hs__buttons hs__buttons--end">
          <button
            type="button"
            class="cbtn cbtn--ghost"
            :disabled="toggling || applying"
            @click="showToggleWarningDialog = false"
          >
            {{ $t('app.general.btn.cancel') }}
          </button>
          <button
            type="button"
            class="cbtn cbtn--danger"
            :disabled="toggling || applying"
            @click="confirmToggle"
          >
            {{ $t('app.general.btn.Proceed') }}
          </button>
        </div>
      </div>
    </v-dialog>
    <v-dialog
      v-model="showChangeWarningDialog"
      max-width="420"
    >
      <div class="hs__dialog">
        <h3>{{ $t('app.wifi.modal.warning.title') }}</h3>
        <p>{{ $t('app.wifi.modal.warning.message') }}</p>
        <div class="hs__buttons hs__buttons--end">
          <button
            type="button"
            class="cbtn cbtn--ghost"
            :disabled="toggling || applying"
            @click="showChangeWarningDialog = false"
          >
            {{ $t('app.general.btn.cancel') }}
          </button>
          <button
            type="button"
            class="cbtn cbtn--danger"
            :disabled="toggling || applying"
            @click="confirmApply"
          >
            {{ $t('app.general.btn.Proceed') }}
          </button>
        </div>
      </div>
    </v-dialog>
  </section>
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import { useAuxApi } from '@/aux_api/useAuxApi'
import type { APCredentials, Device } from '@/aux_api'
import QrcodeVue from 'qrcode.vue'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import i18n from '@/plugins/i18n'
import { useHotspotCheck } from '@/aux_api/useHotspotCheck'
import type { VForm } from '@/types'
import { EventBus } from '@/eventBus'
import { moonrakerErrorMessage } from '@/store/protection/helpers'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'

const { onHotspot } = useHotspotCheck()

@Component({
  directives: {
    square: {
      inserted (el: HTMLElement) {
        // measure → apply
        const update = () => {
          el.style.width = el.offsetHeight + 'px'
        }
        // run once
        update()
        // on window resize
        window.addEventListener('resize', update)
        // on parent-content resize (e.g. right card changes height)
        if ('ResizeObserver' in window) {
          const ro = new ResizeObserver(update)
          ro.observe(el.parentElement!)
          // stash so we can disconnect later
          ; (el as any).__ro__ = ro
        }
        // stash the listener so we can clean up
        (el as any).__sq__ = update
      },
      unbind (el: any) {
        window.removeEventListener('resize', el.__sq__)
        if (el.__ro__) el.__ro__.disconnect()
      }
    }
  },
  components: {
    QrcodeVue,
    ToggleSwitch
  }
})
export default class HotspotManagerCard extends Vue {
  formIsValid: boolean = false

  get onHotspot () {
    return onHotspot.value
  }

  // MuonOS network protection is on and this browser has no identity, so
  // every hotspot request would be refused. The notice says so instead, and
  // polling waits until that changes.
  get locked (): boolean {
    return this.$store.getters['protection/isLocked']
  }

  // Protection came off while this card was open. The config it skipped
  // while locked is loaded now; the status poll only ever reads the state.
  @Watch('locked')
  onLockedChanged (locked: boolean) {
    if (!locked) this.fetchConfig()
  }

  // Reached over Iroh: muon-link refuses every Aux request there, reads
  // included, and the owner decided remote callers may not change Wi-Fi
  // (setup spec 07 §3). The card makes no call and says so instead.
  get remote (): boolean {
    return printerTransportBinding.remote
  }

  @Watch('remote')
  onRemoteChanged (remote: boolean) {
    if (!remote) this.fetchConfig()
  }

  showToggleWarningDialog: boolean = false
  showChangeWarningDialog: boolean = false

  // “Request” methods show the warning dialog instead of immediately doing the thing
  requestToggle () {
    if (onHotspot.value) {
      this.showToggleWarningDialog = true
    } else {
      // if not on hotspot, just toggle immediately
      this.confirmToggle()
    }
  }

  // “Confirm” methods perform the real action, then hide the dialog
  async confirmToggle () {
    this.showToggleWarningDialog = false
    await this.changeHotspotState(!this.apState)
  }

  async requestApplyChanges () {
    // trigger Vuetify’s validation UI
    const form = this.$refs.apForm as VForm
    if (!form || !(form.validate() && this.isDirty)) return

    if (onHotspot.value) {
      // if we are on hotspot, show the warning dialog
      this.showChangeWarningDialog = true
    } else {
      // if not on hotspot, apply changes immediately
      await this.confirmApply()
    }
  }

  async confirmApply () {
    this.showChangeWarningDialog = false
    await this.applyChanges()
  }

  private auxApi = useAuxApi()

  deviceStatus: Device | null = null
  apCredentials: APCredentials | null = null

  editing = false
  applying = false

  toggleEditing () {
    this.editing = !this.editing
    this.resetForm()
  }

  open: boolean = false

  // local form + pristine copy
  form = {
    ssid: '',
    password: '',
    securityEnabled: true
  }

  private original = { ...this.form }

  passwordVisible = false
  private statusPollId: number | null = null
  private destroyed = false
  private requestedApState: boolean | null = null
  private requestedApStateUntil = 0

  async mounted () {
    await this.fetchConfig()
    if (!this.destroyed) {
      this.statusPollId = window.setInterval(() => {
        this.refreshStatus()
      }, 1000)
    }
  }

  beforeDestroy () {
    this.destroyed = true
    if (this.statusPollId !== null) {
      window.clearInterval(this.statusPollId)
      this.statusPollId = null
    }
  }

  private async fetchConfig () {
    if (this.locked || this.remote) return
    try {
      const [statusResponse, credentialsResponse] = await Promise.all([
        this.auxApi.ap.wifiStatusWifiApDeviceStatusGet(),
        this.auxApi.ap.apShowCredentialsWifiApShowGet()
      ])
      this.applyDeviceStatus(statusResponse.data)
      this.apCredentials = credentialsResponse.data
      this.resetForm()
    } catch (e) {
      console.error('Failed to load hotspot config', e)
      if ((e as any)?.response?.status === 403) {
        // A load nobody asked for, refused by network protection. The card
        // says so once the level arrives; a toast would only repeat it.
        this.$store.dispatch('protection/onRefused')
      } else {
        EventBus.$emit(`${this.$t('app.wifi.msg.hotspot.load_error')} ${moonrakerErrorMessage(e)}`, { type: 'error', timeout: 5000 })
      }
    }
  }

  private async refreshStatus () {
    if (this.locked || this.remote) return
    try {
      const response = await this.auxApi.ap.wifiStatusWifiApDeviceStatusGet()
      this.applyDeviceStatus(response.data)
    } catch (_) {
      // Dropping the hotspot can briefly drop Fluidd's request transport too.
      // A later poll reconciles when the printer is reachable again.
    }
  }

  private applyDeviceStatus (status: Device) {
    const observedState = status.state === 'connected'
    if (
      this.requestedApState !== null &&
      Date.now() < this.requestedApStateUntil &&
      observedState !== this.requestedApState
    ) return

    this.requestedApState = null
    this.deviceStatus = status
  }

  get isDirty (): boolean {
    return (
      this.form.ssid !== this.original.ssid ||
      this.form.securityEnabled !== this.original.securityEnabled ||
      (this.form.securityEnabled &&
        this.form.password !== this.original.password)
    )
  }

  private resetForm () {
    if (!this.apCredentials) return
    this.form.ssid = this.apCredentials.ssid
    // Never show a key, even one an older Aux returns: 07 S1 keeps it on the
    // printer's screen. A new key can still be typed here.
    this.form.password = ''
    this.passwordVisible = false
    // Older Aux versions do not expose the safe boolean. Keep the secure
    // fallback until the matching OS update reaches the printer.
    this.form.securityEnabled = this.apCredentials.security_enabled ?? true
    this.original = { ...this.form }
  }

  async applyChanges () {
    if (!this.apCredentials) return
    this.applying = true
    try {
      const payload: APCredentials = {
        ssid: this.form.ssid,
        password: this.form.securityEnabled
          ? this.form.password
          : null
      }
      await this.auxApi.ap.apModifyWifiApModifyPost(payload)
      // on success, commit new “original” snapshot
      // this.original = { ...this.form }
      await this.fetchConfig() // re-fetch to get the latest config
      // Re-activate once so NetworkManager applies the saved profile. This is
      // also the only activation request when the hotspot was previously off.
      await this.changeHotspotState(true)
    } catch (e) {
      console.error('Failed to apply hotspot config', e)
      if ((e as any)?.response?.status === 403) this.$store.dispatch('protection/onRefused')
      EventBus.$emit(`${this.$t('app.wifi.msg.hotspot.apply_error')} ${moonrakerErrorMessage(e)}`, { type: 'error', timeout: 5000 })
    }
    this.applying = false
    this.toggleEditing() // close the form
  }

  undoChanges () {
    this.resetForm()
    this.toggleEditing()
  }

  // —— keep switch ↔ password in sync ——
  @Watch('form.password')
  private onPasswordEdited (newVal: string) {
    this.form.securityEnabled = !!newVal
  }

  @Watch('form.securityEnabled')
  private onSecurityToggled (newVal: boolean) {
    if (!newVal) {
      // switching security off wipes the password
      this.form.password = ''
    } else {
      // switching on → focus the password field
      this.$nextTick(() => {
        const pw = this.$refs.passwordInput as any
        if (pw && pw.focus) pw.focus()
        else if (pw && pw.$el) {
          const inp = pw.$el.querySelector('input')
          inp && inp.focus()
        }
      })
    }
  }

  public get ssidRules (): Array<(v: string) => true | string> {
    return [
      (v: string) => !!v || i18n.t('app.general.simple_form.error.required').toString()
    ]
  }

  /**
   * WPA-PSK rule: either
   *  • exactly 64 hex digits, or
   *  • 8–63 printable-ASCII chars (32–126)
   */
  public get passwordRules (): Array<(v: string) => true | string> {
    return [
      (v: string): true | string => {
        if (!this.form.securityEnabled) return true

        // 1) allow exactly 64 hex digits
        if (/^[0-9A-Fa-f]{64}$/.test(v)) {
          return true
        }

        // 2) enforce length
        if (v.length < 8) {
          return i18n.t('app.wifi.password.too-short').toString()
        }
        if (v.length > 63) {
          return i18n.t('app.wifi.password.too-long').toString()
        }

        // 3) catch any non-printable-ASCII chars
        const invalidChars = Array.from(v)
          .filter(ch => {
            const code = ch.charCodeAt(0)
            return code < 32 || code > 126
          })
          // dedupe same character in the list
          .filter((ch, idx, arr) => arr.indexOf(ch) === idx)
        if (invalidChars.length) {
          return i18n.t('app.wifi.password.invalid-character').toString() + ': ' +
            invalidChars.map(c => {
              const code = c.charCodeAt(0)
              // show either the literal or its hex code if whitespace
              return /\s/.test(c)
                ? `0x${code.toString(16).padStart(2, '0')}`
                : `'${c}'`
            }).join(', ')
        }

        // if we made it here, it's valid ASCII & length
        return true
      }
    ]
  }

  toggling: boolean = false

  private async changeHotspotState (wantsOn?: boolean) {
    // guard: need credentials and not already toggling
    if (!this.apCredentials || this.toggling) return

    // determine desired state
    const turnOn = wantsOn !== undefined
      ? wantsOn
      : this.deviceStatus?.state !== 'connected'

    this.toggling = true
    this.requestedApState = turnOn
    this.requestedApStateUntil = Date.now() + 5000
    this.apState = turnOn
    try {
      if (turnOn) {
        await this.auxApi.ap.apUpWifiApUpPost()
      } else {
        await this.auxApi.ap.apDownWifiApDownPost()
      }
    } catch (e) {
      this.requestedApState = null
      this.apState = this.deviceStatus?.state === 'connected'
      console.error('Hotspot toggle failed', e)
      if ((e as any)?.response?.status === 403) this.$store.dispatch('protection/onRefused')
      EventBus.$emit(`${this.$t('app.wifi.msg.hotspot.toggle_error')} ${moonrakerErrorMessage(e)}`, { type: 'error', timeout: 5000 })
    } finally {
      this.toggling = false
    }
  }

  // ------------------------------------------------------
  // NEW: local switch state for the v-switch
  apState: boolean = false

  // Sync switch → deviceStatus whenever we re-fetch
  @Watch('deviceStatus', { immediate: true })
  private onDeviceStatusChanged (newStatus: Device | null) {
    this.apState = newStatus?.state === 'connected'
  }
  // ------------------------------------------------------

  // A join code only for an open hotspot. A secured hotspot's key, and any
  // code carrying it, appear only on the printer's screen (setup spec 07 S1),
  // so this page never draws one, even when an older Aux returns the key.
  get QrValue (): string {
    if (!this.apCredentials || this.apCredentials.security_enabled !== false) return ''
    const S = this.apCredentials.ssid.replace(/\\/g, '\\\\').replace(/;/g, '\\;')
    return `WIFI:S:${S};T:nopass;H:false;;`
  }

  // Where to get the code instead, when this page draws none.
  get printerName (): string {
    return this.$store.getters['config/getDisplayName'] ?? ''
  }

  delayedEditing: boolean = this.editing
  @Watch('editing')
  onEditingChanged (newVal: boolean) {
    // set a new one
    window.setTimeout(() => {
      this.delayedEditing = newVal
    }, 100)
  }

    @Watch('deviceStatus', { immediate: true })
  emitDeviceStatus (v: Device|null) {
    this.$emit('update:device-status', v)
  }

  @Watch('toggling', { immediate: true })
    emitToggling (v: boolean) {
      this.$emit('update:toggling', v)
    }
}
</script>

<style lang="scss" scoped>
  .hs {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
    padding: 20px;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
  }

  .hs__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .hs__titles {
    min-width: 0;

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

  .hs__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .hs__body {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
  }

  .hs__form {
    display: flex;
    flex: 1 1 280px;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }

  .hs__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 14px;
  }

  .hs__buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .hs__buttons--end {
    justify-content: flex-end;
  }

  .hs__join {
    display: flex;
    flex: 0 1 180px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px;
    border-radius: 16px;
    background: var(--m3d-surface-2);
    text-align: center;

    p {
      margin: 0;
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .hs__qr {
    padding: 8px;
    border-radius: 10px;
    background: #fff;
    line-height: 0;
  }

  .hs__dialog {
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
</style>
