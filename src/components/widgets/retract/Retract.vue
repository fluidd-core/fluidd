<template>
  <v-card-text>
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="12"
        lg="6"
      >
        <app-named-slider
          :label="$t('app.general.label.retract_length')"
          suffix="mm"
          :value="retractLength"
          :reset-value="defaultRetractLength"
          :min="0"
          :max="maxRetractLength"
          :step="0.01"
          overridable
          :disabled="!klippyReady"
          :locked="isMobileUserAgent"
          :loading="hasWait($waits.onSetRetractLength)"
          @submit="setRetractLength"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="12"
        lg="6"
      >
        <app-named-slider
          :label="$t('app.general.label.unretract_extra_length')"
          suffix="mm"
          :value="unretractExtraLength"
          :reset-value="defaultUnretractExtraLength"
          :min="0"
          :max="maxUnretractExtraLength"
          :step="0.01"
          overridable
          :disabled="!klippyReady"
          :locked="isMobileUserAgent"
          :loading="hasWait($waits.onSetUnretractExtraLength)"
          @submit="setUnRetractExtraLength"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="12"
        lg="6"
      >
        <app-named-slider
          :label="$t('app.general.label.retract_speed')"
          suffix="mm/s"
          :value="retractSpeed"
          :reset-value="defaultRetractSpeed"
          :min="0"
          :step="1"
          :max="maxRetractSpeed"
          overridable
          :disabled="!klippyReady"
          :locked="isMobileUserAgent"
          :loading="hasWait($waits.onSetRetractSpeed)"
          @submit="setRetractSpeed"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="12"
        lg="6"
      >
        <app-named-slider
          :label="$t('app.general.label.unretract_speed')"
          suffix="mm/s"
          :value="unretractSpeed"
          :reset-value="defaultUnretractSpeed"
          :min="0"
          :step="1"
          :max="maxUnretractSpeed"
          overridable
          :disabled="!klippyReady"
          :locked="isMobileUserAgent"
          :loading="hasWait($waits.onSetUnretractSpeed)"
          @submit="setUnretractSpeed"
        />
      </v-col>
    </v-row>

    <v-row v-if="supportsZHopHeight">
      <v-col
        cols="12"
        sm="6"
        md="12"
        lg="6"
      >
        <app-named-slider
          :label="$t('app.general.label.z_hop_height')"
          suffix="mm"
          :value="zHopHeight"
          :reset-value="defaultZHopHeight"
          :min="0"
          :step="0.1"
          :max="maxZHopHeight"
          overridable
          :disabled="!klippyReady"
          :locked="isMobileUserAgent"
          :loading="hasWait($waits.onSetZHopHeight)"
          @submit="setZHopHeight"
        />
      </v-col>
    </v-row>
  </v-card-text>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import BrowserMixin from '@/mixins/browser'
import type { KlippyApp } from '@/store/printer/types'

@Component({})
export default class Retract extends Mixins(StateMixin, BrowserMixin) {
  get firmwareRetraction () {
    const printerSettings: Klipper.SettingsState = this.$typedGetters['printer/getPrinterSettings']

    return printerSettings.firmware_retraction
  }

  get defaultRetractLength (): number {
    return this.firmwareRetraction?.retract_length ?? 0
  }

  get retractLength (): number {
    return this.$typedState.printer.printer.firmware_retraction?.retract_length ?? 0
  }

  get maxRetractLength (): number {
    if (this.defaultRetractLength <= 0) return 15
    return Math.round(this.defaultRetractLength * 2 * 100) / 100
  }

  get defaultRetractSpeed (): number {
    return this.firmwareRetraction?.retract_speed ?? 0
  }

  get retractSpeed (): number {
    return this.$typedState.printer.printer.firmware_retraction?.retract_speed ?? 0
  }

  get maxRetractSpeed (): number {
    if (this.defaultRetractSpeed <= 0) return 100
    return Math.round(this.defaultRetractSpeed * 2)
  }

  get defaultUnretractSpeed (): number {
    return this.firmwareRetraction?.unretract_speed ?? 0
  }

  get unretractSpeed (): number {
    return this.$typedState.printer.printer.firmware_retraction?.unretract_speed ?? 0
  }

  get maxUnretractSpeed (): number {
    if (this.defaultUnretractSpeed <= 0) return 100
    return Math.round(this.defaultUnretractSpeed * 2)
  }

  get defaultUnretractExtraLength (): number {
    return this.firmwareRetraction?.unretract_extra_length ?? 0
  }

  get unretractExtraLength (): number {
    return this.$typedState.printer.printer.firmware_retraction?.unretract_extra_length ?? 0
  }

  get maxUnretractExtraLength (): number {
    if (this.defaultUnretractExtraLength <= 0) return 15
    return Math.round(this.defaultUnretractExtraLength * 2 * 100) / 100
  }

  get defaultZHopHeight (): number {
    return this.firmwareRetraction?.z_hop_height ?? 0
  }

  get zHopHeight (): number {
    return this.$typedState.printer.printer.firmware_retraction?.z_hop_height ?? 0
  }

  get maxZHopHeight (): number {
    if (this.defaultZHopHeight <= 0) return 2
    return Math.round(this.defaultZHopHeight * 2 * 100) / 100
  }

  get klippyApp (): KlippyApp {
    return this.$typedGetters['printer/getKlippyApp']
  }

  get supportsZHopHeight () {
    return this.klippyApp.isKalicoOrDangerKlipper
  }

  setRetractLength (val: number) {
    this.sendGcode(`SET_RETRACTION RETRACT_LENGTH=${val}`, this.$waits.onSetRetractLength)
  }

  setRetractSpeed (val: number) {
    this.sendGcode(`SET_RETRACTION RETRACT_SPEED=${val}`, this.$waits.onSetRetractSpeed)
  }

  setUnretractSpeed (val: number) {
    this.sendGcode(`SET_RETRACTION UNRETRACT_SPEED=${val}`, this.$waits.onSetUnretractSpeed)
  }

  setUnRetractExtraLength (val: number) {
    this.sendGcode(`SET_RETRACTION UNRETRACT_EXTRA_LENGTH=${val}`, this.$waits.onSetUnretractExtraLength)
  }

  setZHopHeight (val: number) {
    this.sendGcode(`SET_RETRACTION Z_HOP_HEIGHT=${val}`, this.$waits.onSetZHopHeight)
  }
}
</script>
