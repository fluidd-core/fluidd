<template>
  <div
    id="toolhead"
    class="m3-sets"
    data-tid="moving-settings"
  >
    <section class="m3-set">
      <h2 class="m3-set__title">
        Moving
      </h2>
      <p class="m3-set__intro">
        How Control's move pad and the plate's buttons move the printer.
      </p>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>The head's speed</b>
          <span>For a press of the pad or a click on the plate.</span>
        </div>
        <div class="m3-set__control">
          <number-field
            :value="defaultToolheadXYSpeed"
            unit="mm/s"
            :min="1"
            :max="1000"
            label="The head's speed"
            @change="setDefaultToolheadYXSpeed"
          />
        </div>
      </div>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>The plate's speed</b>
        </div>
        <div class="m3-set__control">
          <number-field
            :value="defaultToolheadZSpeed"
            unit="mm/s"
            :min="1"
            :max="100"
            label="The plate's speed"
            @change="setDefaultToolheadZSpeed"
          />
        </div>
      </div>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>Reverse an axis</b>
          <span>Only for a printer whose motors run the other way. The M1's directions are known already.</span>
        </div>
        <div class="m3-set__control">
          <label class="m3-set__check"><input
            type="checkbox"
            :checked="invertX"
            @change="onInvert('x', $event)"
          > X</label>
          <label class="m3-set__check"><input
            type="checkbox"
            :checked="invertY"
            @change="onInvert('y', $event)"
          > Y</label>
          <label class="m3-set__check"><input
            type="checkbox"
            :checked="invertZ"
            @change="onInvert('z', $event)"
          > Z</label>
        </div>
      </div>
      <div
        v-if="printerSupportsForceMove"
        class="m3-set__row"
      >
        <div class="m3-set__label">
          <b>Moving without homing</b>
          <span>Warn before a move that skips Klipper's limits (FORCE_MOVE).</span>
        </div>
        <div class="m3-set__control">
          <toggle-switch
            :value="forceMoveToggleWarning"
            label="Warn before moving without homing"
            @input="forceMoveToggleWarning = $event"
          />
        </div>
      </div>
    </section>

    <section class="m3-set">
      <h2 class="m3-set__title">
        Extruding
      </h2>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>How much a press pushes</b>
          <span>Control's Extrude and Retract.</span>
        </div>
        <div class="m3-set__control">
          <number-field
            :value="defaultExtrudeLength"
            unit="mm"
            :min="1"
            :max="200"
            label="Extrude length"
            @change="setDefaultExtrudeLength"
          />
        </div>
      </div>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>How fast</b>
        </div>
        <div class="m3-set__control">
          <number-field
            :value="defaultExtrudeSpeed"
            unit="mm/s"
            :min="1"
            :max="50"
            label="Extrude speed"
            @change="setDefaultExtrudeSpeed"
          />
        </div>
      </div>
    </section>

    <section class="m3-set">
      <h2 class="m3-set__title">
        Calibration helpers
      </h2>
      <p class="m3-set__intro">
        Open a helper by itself when the printer starts one of these from a macro or the console.
      </p>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>The paper test</b>
          <span>Manual probing, to set how close the nozzle starts.</span>
        </div>
        <div class="m3-set__control">
          <toggle-switch
            :value="showManualProbeDialogAutomatically"
            label="Open the paper test helper"
            @input="showManualProbeDialogAutomatically = $event"
          />
        </div>
      </div>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>Bed screws</b>
          <span>BED_SCREWS_ADJUST and SCREWS_TILT_CALCULATE, on printers that have them.</span>
        </div>
        <div class="m3-set__control">
          <toggle-switch
            :value="showBedScrewsAdjustDialogAutomatically && showScrewsTiltAdjustDialogAutomatically"
            label="Open the bed screws helpers"
            @input="showBedScrewsAdjustDialogAutomatically = $event; showScrewsTiltAdjustDialogAutomatically = $event"
          />
        </div>
      </div>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>Start again</b>
          <span>These settings back to how they came.</span>
        </div>
        <div class="m3-set__control">
          <button
            type="button"
            class="cbtn cbtn--ghost"
            @click="handleReset"
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Ref, Mixins } from 'vue-property-decorator'
import NumberField from '@/components/control/NumberField.vue'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import { defaultState } from '@/store/config/state'
import type { VInput } from '@/types'
import ToolheadMixin from '@/mixins/toolhead'
import type { ToolheadControlStyle } from '@/store/config/types'

@Component({
  components: { NumberField, ToggleSwitch }
})
export default class ToolHeadSettings extends Mixins(ToolheadMixin) {
  @Ref('toolheadMoveDistances')
  readonly toolheadMoveDistancesElement!: VInput

  @Ref('toolheadXYMoveDistances')
  readonly toolheadXYMoveDistancesElement!: VInput

  @Ref('toolheadZMoveDistances')
  readonly toolheadZMoveDistancesElement!: VInput

  @Ref('toolheadCircleXYMoveDistances')
  readonly toolheadCircleXYMoveDistancesElement!: VInput

  @Ref('toolheadCircleZMoveDistances')
  readonly toolheadCircleZMoveDistancesElement!: VInput

  @Ref('zAdjustValues')
  readonly zAdjustValuesElement!: VInput

  get defaultExtrudeSpeed () {
    return this.$store.state.config.uiSettings.general.defaultExtrudeSpeed
  }

  setDefaultExtrudeSpeed (value: string) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.defaultExtrudeSpeed',
      value: +value,
      server: true
    })
  }

  get defaultExtrudeLength () {
    return this.$store.state.config.uiSettings.general.defaultExtrudeLength
  }

  setDefaultExtrudeLength (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.defaultExtrudeLength',
      value: +value,
      server: true
    })
  }

  get defaultToolheadMoveLength () {
    return this.$store.state.config.uiSettings.general.defaultToolheadMoveLength
  }

  setDefaultToolheadMoveLength (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.defaultToolheadMoveLength',
      value: +value,
      server: true
    })
  }

  get defaultToolheadXYSpeed () {
    return this.$store.state.config.uiSettings.general.defaultToolheadXYSpeed
  }

  setDefaultToolheadYXSpeed (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.defaultToolheadXYSpeed',
      value: +value,
      server: true
    })
  }

  get defaultToolheadZSpeed () {
    return this.$store.state.config.uiSettings.general.defaultToolheadZSpeed
  }

  setDefaultToolheadZSpeed (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.defaultToolheadZSpeed',
      value: +value,
      server: true
    })
  }

  get zAdjustValues () {
    return this.$store.state.config.uiSettings.general.zAdjustDistances
  }

  set zAdjustValues (value: (number | string)[]) {
    if (!this.zAdjustValuesElement.validate(true)) {
      return
    }

    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.zAdjustDistances',
      value: [...new Set(value.map(Number))].sort((a, b) => a - b),
      server: true
    })
  }

  get toolheadCircleXYHomingEnabled () {
    return this.$store.state.config.uiSettings.general.toolheadCircleXYHomingEnabled
  }

  set toolheadCircleXYHomingEnabled (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.toolheadCircleXYHomingEnabled',
      value,
      server: true
    })
  }

  get toolheadControlStyle () {
    return this.$store.state.config.uiSettings.general.toolheadControlStyle
  }

  set toolheadControlStyle (value: ToolheadControlStyle) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.toolheadControlStyle',
      value,
      server: true
    })
  }

  get availableToolheadControlStyles () {
    return [
      {
        value: 'cross',
        text: this.$t('app.general.label.cross')
      },
      {
        value: 'bars',
        text: this.$t('app.general.label.bars')
      },
      {
        value: 'circle',
        text: this.$t('app.general.label.circle')
      }
    ]
  }

  get toolheadMoveDistances () {
    return this.$store.state.config.uiSettings.general.toolheadMoveDistances
  }

  set toolheadMoveDistances (value: (number | string)[]) {
    if (!this.toolheadMoveDistancesElement.validate(true)) {
      return
    }

    const toolheadMoveDistances = [...new Set(value.map(Number))]
      .sort((a, b) => a - b)

    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.toolheadMoveDistances',
      value: toolheadMoveDistances,
      server: true
    })

    if (toolheadMoveDistances.includes(this.defaultToolheadMoveLength) === false) {
      this.setDefaultToolheadMoveLength(toolheadMoveDistances[0])
    }
  }

  get toolheadXYMoveDistances () {
    return this.$store.state.config.uiSettings.general.toolheadXYMoveDistances
  }

  set toolheadXYMoveDistances (value: (number | string)[]) {
    if (!this.toolheadXYMoveDistancesElement.validate(true)) {
      return
    }

    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.toolheadXYMoveDistances',
      value: [...new Set(value.map(Number))].sort((a, b) => a - b),
      server: true
    })
  }

  get toolheadCircleXYMoveDistances () {
    return this.$store.state.config.uiSettings.general.toolheadCircleXYMoveDistances
  }

  set toolheadCircleXYMoveDistances (value: (number | string)[]) {
    if (!this.toolheadCircleXYMoveDistancesElement.validate(true)) {
      return
    }

    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.toolheadCircleXYMoveDistances',
      value: [...new Set(value.map(Number))].sort((a, b) => a - b),
      server: true
    })
  }

  get toolheadZMoveDistances () {
    return this.$store.state.config.uiSettings.general.toolheadZMoveDistances
  }

  set toolheadZMoveDistances (value: (number | string)[]) {
    if (!this.toolheadZMoveDistancesElement.validate(true)) {
      return
    }

    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.toolheadZMoveDistances',
      value: [...new Set(value.map(Number))].sort((a, b) => a - b),
      server: true
    })
  }

  get toolheadCircleZMoveDistances () {
    return this.$store.state.config.uiSettings.general.toolheadCircleZMoveDistances
  }

  set toolheadCircleZMoveDistances (value: (number | string)[]) {
    if (!this.toolheadCircleZMoveDistancesElement.validate(true)) {
      return
    }

    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.toolheadCircleZMoveDistances',
      value: [...new Set(value.map(Number))].sort((a, b) => a - b),
      server: true
    })
  }

  get useGcodeCoords () {
    return this.$store.state.config.uiSettings.general.useGcodeCoords
  }

  set useGcodeCoords (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.useGcodeCoords',
      value,
      server: true
    })
  }

  get invertX () {
    return this.$store.state.config.uiSettings.general.axis.x.inverted
  }

  set invertX (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.axis.x.inverted',
      value,
      server: true
    })
  }

  get invertY () {
    return this.$store.state.config.uiSettings.general.axis.y.inverted
  }

  set invertY (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.axis.y.inverted',
      value,
      server: true
    })
  }

  get invertZ () {
    return this.$store.state.config.uiSettings.general.axis.z.inverted
  }

  set invertZ (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.axis.z.inverted',
      value,
      server: true
    })
  }

  get printerSupportsForceMove () {
    return this.$store.getters['printer/getPrinterSettings']('force_move.enable_force_move') ?? false
  }

  get showManualProbeDialogAutomatically () {
    return this.$store.state.config.uiSettings.general.showManualProbeDialogAutomatically
  }

  set showManualProbeDialogAutomatically (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.showManualProbeDialogAutomatically',
      value,
      server: true
    })
  }

  get showBedScrewsAdjustDialogAutomatically () {
    return this.$store.state.config.uiSettings.general.showBedScrewsAdjustDialogAutomatically
  }

  set showBedScrewsAdjustDialogAutomatically (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.showBedScrewsAdjustDialogAutomatically',
      value,
      server: true
    })
  }

  get showScrewsTiltAdjustDialogAutomatically () {
    return this.$store.state.config.uiSettings.general.showScrewsTiltAdjustDialogAutomatically
  }

  set showScrewsTiltAdjustDialogAutomatically (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.showScrewsTiltAdjustDialogAutomatically',
      value,
      server: true
    })
  }

  get forceMoveToggleWarning () {
    return this.$store.state.config.uiSettings.general.forceMoveToggleWarning
  }

  set forceMoveToggleWarning (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.forceMoveToggleWarning',
      value,
      server: true
    })
  }

  onInvert (axis: 'x' | 'y' | 'z', event: Event) {
    const checked = (event.target as HTMLInputElement).checked
    if (axis === 'x') this.invertX = checked
    else if (axis === 'y') this.invertY = checked
    else this.invertZ = checked
  }

  handleReset () {
    let value = defaultState().uiSettings.general
    const current = this.$store.state.config.uiSettings.general
    value = {
      ...value,
      instanceName: current.instanceName,
      chartVisible: current.chartVisible,
      hideTempWaits: current.hideTempWaits
    }
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general',
      value,
      server: true
    })
  }
}
</script>
