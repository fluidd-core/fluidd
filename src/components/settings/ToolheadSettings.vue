<template>
  <div>
    <v-subheader id="toolhead">
      {{ $t('app.setting.title.tool') }}
    </v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4"
    >
      <app-setting
        :title="$t('app.setting.label.gcode_coords')"
        :sub-title="$t('app.setting.tooltip.gcode_coords')"
        :r-cols="2"
      >
        <v-switch
          v-model="useGcodeCoords"
          hide-details
          class="mt-0 mb-4"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.toolhead_control_style')">
        <v-select
          v-model="toolheadControlStyle"
          filled
          dense
          hide-details="auto"
          :items="availableToolheadControlStyles"
        />
      </app-setting>

      <v-divider />

      <template v-if="toolheadControlStyle === 'cross' || toolheadControlStyle === 'circle'">
        <app-setting :title="$t('app.setting.label.invert_x_control')">
          <v-switch
            v-model="invertX"
            hide-details
            class="mt-0 mb-4"
          />
        </app-setting>

        <v-divider />

        <app-setting :title="$t('app.setting.label.invert_y_control')">
          <v-switch
            v-model="invertY"
            hide-details
            class="mt-0 mb-4"
          />
        </app-setting>

        <v-divider />

        <app-setting :title="$t('app.setting.label.invert_z_control')">
          <v-switch
            v-model="invertZ"
            hide-details
            class="mt-0 mb-4"
          />
        </app-setting>

        <v-divider />
      </template>

      <template v-if="toolheadControlStyle === 'cross'">
        <app-setting :title="$t('app.setting.label.toolhead_move_distances')">
          <v-combobox
            ref="toolheadMoveDistances"
            v-model="toolheadMoveDistances"
            filled
            dense
            hide-selected
            hide-details="auto"
            suffix="mm"
            multiple
            small-chips
            append-icon=""
            deletable-chips
            :rules="[
              $rules.lengthGreaterThanOrEqual(1),
              $rules.lengthLessThanOrEqual(6),
              $rules.numberArrayValid
            ]"
          />
        </app-setting>

        <v-divider />

        <app-setting :title="$t('app.setting.label.default_toolhead_move_length')">
          <v-select
            :value="defaultToolheadMoveLength"
            :items="toolheadMoveDistances"
            :rules="[
              $rules.required,
              $rules.numberValid
            ]"
            filled
            dense
            single-line
            hide-details="auto"
            suffix="mm"
            @change="setDefaultToolheadMoveLength"
          />
        </app-setting>

        <v-divider />
      </template>

      <template v-else-if="toolheadControlStyle === 'bars'">
        <app-setting :title="$t('app.setting.label.toolhead_xy_move_distances')">
          <v-combobox
            ref="toolheadXYMoveDistances"
            v-model="toolheadXYMoveDistances"
            filled
            dense
            hide-selected
            hide-details="auto"
            suffix="mm"
            multiple
            small-chips
            append-icon=""
            deletable-chips
            :rules="[
              $rules.lengthGreaterThanOrEqual(1),
              $rules.lengthLessThanOrEqual(3),
              $rules.numberArrayValid
            ]"
          />
        </app-setting>

        <v-divider />

        <app-setting :title="$t('app.setting.label.toolhead_z_move_distances')">
          <v-combobox
            ref="toolheadZMoveDistances"
            v-model="toolheadZMoveDistances"
            filled
            dense
            hide-selected
            hide-details="auto"
            suffix="mm"
            multiple
            small-chips
            append-icon=""
            deletable-chips
            :rules="[
              $rules.lengthGreaterThanOrEqual(1),
              $rules.lengthLessThanOrEqual(3),
              $rules.numberArrayValid
            ]"
          />
        </app-setting>

        <v-divider />
      </template>

      <template v-else-if="toolheadControlStyle === 'circle'">
        <app-setting :title="$t('app.setting.label.toolhead_xy_move_distances')">
          <v-combobox
            ref="toolheadCircleXYMoveDistances"
            v-model="toolheadCircleXYMoveDistances"
            filled
            dense
            hide-selected
            hide-details="auto"
            suffix="mm"
            multiple
            small-chips
            append-icon=""
            deletable-chips
            :rules="[
              $rules.lengthGreaterThanOrEqual(4),
              $rules.lengthLessThanOrEqual(4),
              $rules.numberArrayValid
            ]"
          />
        </app-setting>

        <v-divider />

        <app-setting :title="$t('app.setting.label.toolhead_z_move_distances')">
          <v-combobox
            ref="toolheadCircleZMoveDistances"
            v-model="toolheadCircleZMoveDistances"
            filled
            dense
            hide-selected
            hide-details="auto"
            suffix="mm"
            multiple
            small-chips
            append-icon=""
            deletable-chips
            :rules="[
              $rules.lengthGreaterThanOrEqual(4),
              $rules.lengthLessThanOrEqual(4),
              $rules.numberArrayValid
            ]"
          />
        </app-setting>

        <v-divider />

        <app-setting :title="$t('app.setting.label.enable_xy_homing')">
          <v-switch
            v-model="toolheadCircleXYHomingEnabled"
            hide-details
            class="mt-0 mb-4"
          />
        </app-setting>

        <v-divider />
      </template>

      <app-setting :title="$t('app.setting.label.default_toolhead_xy_speed')">
        <app-text-field
          :value="defaultToolheadXYSpeed"
          :rules="[
            $rules.required,
            $rules.numberValid,
            $rules.numberGreaterThanOrEqual(1)
          ]"
          filled
          dense
          single-line
          hide-details="auto"
          suffix="mm/s"
          submit-on-change
          @submit="setDefaultToolheadXYSpeed"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.default_toolhead_z_speed')">
        <app-text-field
          :value="defaultToolheadZSpeed"
          :rules="[
            $rules.required,
            $rules.numberValid,
            $rules.numberGreaterThanOrEqual(1)
          ]"
          filled
          dense
          single-line
          hide-details="auto"
          suffix="mm/s"
          submit-on-change
          @submit="setDefaultToolheadZSpeed"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.z_adjust_values')">
        <v-combobox
          ref="zAdjustValues"
          v-model="zAdjustValues"
          filled
          dense
          hide-selected
          hide-details="auto"
          suffix="mm"
          multiple
          small-chips
          append-icon=""
          deletable-chips
          :rules="[
            $rules.lengthGreaterThanOrEqual(1),
            $rules.lengthLessThanOrEqual(4),
            $rules.numberArrayValid
          ]"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.default_extrude_length')">
        <app-text-field
          :value="defaultExtrudeLength"
          :rules="[
            $rules.required,
            $rules.numberValid,
            $rules.numberGreaterThanOrEqual(1)
          ]"
          filled
          dense
          single-line
          hide-details="auto"
          suffix="mm"
          submit-on-change
          @submit="setDefaultExtrudeLength"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.default_extrude_speed')">
        <app-text-field
          :value="defaultExtrudeSpeed"
          :rules="[
            $rules.required,
            $rules.numberValid,
            $rules.numberGreaterThanOrEqual(1)
          ]"
          filled
          dense
          single-line
          hide-details="auto"
          suffix="mm/s"
          submit-on-change
          @submit="setDefaultExtrudeSpeed"
        />
      </app-setting>

      <v-divider />

      <app-setting
        :title="$t('app.setting.label.show_manual_probe_dialog_automatically')"
        :sub-title="$t('app.setting.tooltip.show_manual_probe_dialog_automatically')"
      >
        <v-switch
          v-model="showManualProbeDialogAutomatically"
          hide-details
          class="mt-0 mb-4"
        />
      </app-setting>

      <v-divider />

      <app-setting
        :title="$t('app.setting.label.show_bed_screws_adjust_dialog_automatically')"
        :sub-title="$t('app.setting.tooltip.show_bed_screws_adjust_dialog_automatically')"
      >
        <v-switch
          v-model="showBedScrewsAdjustDialogAutomatically"
          hide-details
          class="mt-0 mb-4"
        />
      </app-setting>

      <v-divider />

      <app-setting
        :title="$t('app.setting.label.show_screws_tilt_adjust_dialog_automatically')"
        :sub-title="$t('app.setting.tooltip.show_screws_tilt_adjust_dialog_automatically')"
      >
        <v-switch
          v-model="showScrewsTiltAdjustDialogAutomatically"
          hide-details
          class="mt-0 mb-4"
        />
      </app-setting>

      <v-divider />

      <template v-if="printerSupportsForceMove">
        <app-setting :title="$t('app.setting.label.force_move_toggle_warning')">
          <v-switch
            v-model="forceMoveToggleWarning"
            hide-details
            class="mt-0 mb-4"
          />
        </app-setting>

        <v-divider />
      </template>

      <app-setting :title="$t('app.setting.label.reset')">
        <app-btn
          outlined
          small
          color="primary"
          @click="handleReset"
        >
          {{ $t('app.setting.btn.reset') }}
        </app-btn>
      </app-setting>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Ref, Mixins } from 'vue-property-decorator'
import { defaultState } from '@/store/config/state'
import type { VCombobox } from 'vuetify/lib'
import ToolheadMixin from '@/mixins/toolhead'
import type { GeneralConfig, ToolheadControlStyle } from '@/store/config/types'
import type { KlipperPrinterSettings } from '@/store/printer/types'

@Component({
  components: {}
})
export default class ToolHeadSettings extends Mixins(ToolheadMixin) {
  @Ref('toolheadMoveDistances')
  readonly toolheadMoveDistancesElement!: VCombobox

  @Ref('toolheadXYMoveDistances')
  readonly toolheadXYMoveDistancesElement!: VCombobox

  @Ref('toolheadZMoveDistances')
  readonly toolheadZMoveDistancesElement!: VCombobox

  @Ref('toolheadCircleXYMoveDistances')
  readonly toolheadCircleXYMoveDistancesElement!: VCombobox

  @Ref('toolheadCircleZMoveDistances')
  readonly toolheadCircleZMoveDistancesElement!: VCombobox

  @Ref('zAdjustValues')
  readonly zAdjustValuesElement!: VCombobox

  get defaultExtrudeSpeed (): number {
    return this.$typedState.config.uiSettings.general.defaultExtrudeSpeed
  }

  setDefaultExtrudeSpeed (value: string) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.defaultExtrudeSpeed',
      value: +value,
      server: true
    })
  }

  get defaultExtrudeLength (): number {
    return this.$typedState.config.uiSettings.general.defaultExtrudeLength
  }

  setDefaultExtrudeLength (value: number) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.defaultExtrudeLength',
      value: +value,
      server: true
    })
  }

  get defaultToolheadMoveLength (): number {
    return this.$typedState.config.uiSettings.general.defaultToolheadMoveLength
  }

  setDefaultToolheadMoveLength (value: number) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.defaultToolheadMoveLength',
      value: +value,
      server: true
    })
  }

  get defaultToolheadXYSpeed (): number {
    return this.$typedState.config.uiSettings.general.defaultToolheadXYSpeed
  }

  setDefaultToolheadXYSpeed (value: number) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.defaultToolheadXYSpeed',
      value: +value,
      server: true
    })
  }

  get defaultToolheadZSpeed (): number {
    return this.$typedState.config.uiSettings.general.defaultToolheadZSpeed
  }

  setDefaultToolheadZSpeed (value: number) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.defaultToolheadZSpeed',
      value: +value,
      server: true
    })
  }

  get zAdjustValues (): number[] {
    return this.$typedState.config.uiSettings.general.zAdjustDistances
  }

  set zAdjustValues (value: (number | string)[]) {
    if (!this.zAdjustValuesElement.validate(true)) {
      return
    }

    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.zAdjustDistances',
      value: [...new Set(value.map(Number))].sort((a, b) => a - b),
      server: true
    })
  }

  get toolheadCircleXYHomingEnabled (): boolean {
    return this.$typedState.config.uiSettings.general.toolheadCircleXYHomingEnabled
  }

  set toolheadCircleXYHomingEnabled (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.toolheadCircleXYHomingEnabled',
      value,
      server: true
    })
  }

  get toolheadControlStyle (): ToolheadControlStyle {
    return this.$typedState.config.uiSettings.general.toolheadControlStyle
  }

  set toolheadControlStyle (value: ToolheadControlStyle) {
    this.$typedDispatch('config/saveByPath', {
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

  get toolheadMoveDistances (): number[] {
    return this.$typedState.config.uiSettings.general.toolheadMoveDistances
  }

  set toolheadMoveDistances (value: (number | string)[]) {
    if (!this.toolheadMoveDistancesElement.validate(true)) {
      return
    }

    const toolheadMoveDistances = [...new Set(value.map(Number))]
      .sort((a, b) => a - b)

    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.toolheadMoveDistances',
      value: toolheadMoveDistances,
      server: true
    })

    if (toolheadMoveDistances.includes(this.defaultToolheadMoveLength) === false) {
      this.setDefaultToolheadMoveLength(toolheadMoveDistances[0])
    }
  }

  get toolheadXYMoveDistances (): number[] {
    return this.$typedState.config.uiSettings.general.toolheadXYMoveDistances
  }

  set toolheadXYMoveDistances (value: (number | string)[]) {
    if (!this.toolheadXYMoveDistancesElement.validate(true)) {
      return
    }

    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.toolheadXYMoveDistances',
      value: [...new Set(value.map(Number))].sort((a, b) => a - b),
      server: true
    })
  }

  get toolheadCircleXYMoveDistances (): number[] {
    return this.$typedState.config.uiSettings.general.toolheadCircleXYMoveDistances
  }

  set toolheadCircleXYMoveDistances (value: (number | string)[]) {
    if (!this.toolheadCircleXYMoveDistancesElement.validate(true)) {
      return
    }

    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.toolheadCircleXYMoveDistances',
      value: [...new Set(value.map(Number))].sort((a, b) => a - b),
      server: true
    })
  }

  get toolheadZMoveDistances (): number[] {
    return this.$typedState.config.uiSettings.general.toolheadZMoveDistances
  }

  set toolheadZMoveDistances (value: (number | string)[]) {
    if (!this.toolheadZMoveDistancesElement.validate(true)) {
      return
    }

    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.toolheadZMoveDistances',
      value: [...new Set(value.map(Number))].sort((a, b) => a - b),
      server: true
    })
  }

  get toolheadCircleZMoveDistances (): number[] {
    return this.$typedState.config.uiSettings.general.toolheadCircleZMoveDistances
  }

  set toolheadCircleZMoveDistances (value: (number | string)[]) {
    if (!this.toolheadCircleZMoveDistancesElement.validate(true)) {
      return
    }

    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.toolheadCircleZMoveDistances',
      value: [...new Set(value.map(Number))].sort((a, b) => a - b),
      server: true
    })
  }

  get useGcodeCoords (): boolean {
    return this.$typedState.config.uiSettings.general.useGcodeCoords
  }

  set useGcodeCoords (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.useGcodeCoords',
      value,
      server: true
    })
  }

  get invertX (): boolean {
    return this.$typedState.config.uiSettings.general.axis.x.inverted
  }

  set invertX (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.axis.x.inverted',
      value,
      server: true
    })
  }

  get invertY (): boolean {
    return this.$typedState.config.uiSettings.general.axis.y.inverted
  }

  set invertY (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.axis.y.inverted',
      value,
      server: true
    })
  }

  get invertZ (): boolean {
    return this.$typedState.config.uiSettings.general.axis.z.inverted
  }

  set invertZ (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.axis.z.inverted',
      value,
      server: true
    })
  }

  get printerSupportsForceMove (): boolean {
    const printerSettings: KlipperPrinterSettings = this.$typedGetters['printer/getPrinterSettings']

    return printerSettings.force_move?.enable_force_move ?? false
  }

  get showManualProbeDialogAutomatically (): boolean {
    return this.$typedState.config.uiSettings.general.showManualProbeDialogAutomatically
  }

  set showManualProbeDialogAutomatically (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.showManualProbeDialogAutomatically',
      value,
      server: true
    })
  }

  get showBedScrewsAdjustDialogAutomatically (): boolean {
    return this.$typedState.config.uiSettings.general.showBedScrewsAdjustDialogAutomatically
  }

  set showBedScrewsAdjustDialogAutomatically (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.showBedScrewsAdjustDialogAutomatically',
      value,
      server: true
    })
  }

  get showScrewsTiltAdjustDialogAutomatically (): boolean {
    return this.$typedState.config.uiSettings.general.showScrewsTiltAdjustDialogAutomatically
  }

  set showScrewsTiltAdjustDialogAutomatically (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.showScrewsTiltAdjustDialogAutomatically',
      value,
      server: true
    })
  }

  get forceMoveToggleWarning (): boolean {
    return this.$typedState.config.uiSettings.general.forceMoveToggleWarning
  }

  set forceMoveToggleWarning (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.forceMoveToggleWarning',
      value,
      server: true
    })
  }

  handleReset () {
    const { instanceName, chartVisible, hideTempWaits }: GeneralConfig = this.$typedState.config.uiSettings.general

    const value: GeneralConfig = {
      ...defaultState().uiSettings.general,
      instanceName,
      chartVisible,
      hideTempWaits
    }

    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general',
      value,
      server: true
    })
  }
}
</script>
