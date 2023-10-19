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

      <template v-if="toolheadControlStyle === 'cross'">
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

      <app-setting :title="$t('app.setting.label.default_toolhead_xy_speed')">
        <v-text-field
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
          @change="setDefaultToolheadYXSpeed"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.default_toolhead_z_speed')">
        <v-text-field
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
          @change="setDefaultToolheadZSpeed"
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
        <v-text-field
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
          @change="setDefaultExtrudeLength"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.default_extrude_speed')">
        <v-text-field
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
          @change="setDefaultExtrudeSpeed"
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
import type { VInput } from '@/types'
import ToolheadMixin from '@/mixins/toolhead'
import type { ToolheadControlStyle } from '@/store/config/types'

@Component({
  components: {}
})
export default class ToolHeadSettings extends Mixins(ToolheadMixin) {
  @Ref('toolheadMoveDistances')
  readonly toolheadMoveDistancesElement!: VInput

  @Ref('toolheadXYMoveDistances')
  readonly toolheadXYMoveDistancesElement!: VInput

  @Ref('toolheadZMoveDistances')
  readonly toolheadZMoveDistancesElement!: VInput

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

    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.toolheadMoveDistances',
      value: [...new Set(value.map(Number))].sort((a, b) => a - b),
      server: true
    })
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

  get printerSupportsSpoolman () {
    return this.$store.getters['spoolman/getSupported']
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
