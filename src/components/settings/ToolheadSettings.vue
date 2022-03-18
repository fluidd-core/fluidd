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

      <app-setting :title="$t('app.setting.label.default_extrude_length')">
        <v-text-field
          :value="defaultExtrudeLength"
          :rules="[rules.numRequired, rules.numMin]"
          filled
          dense
          single-line
          hide-details
          suffix="mm"
          @change="setDefaultExtrudeLength"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.default_extrude_speed')">
        <v-text-field
          :value="defaultExtrudeSpeed"
          :rules="[rules.numRequired, rules.numMin]"
          filled
          dense
          single-line
          hide-details
          suffix="mm/s"
          @change="setDefaultExtrudeSpeed"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.default_toolhead_move_length')">
        <v-select
          :value="defaultToolheadMoveLength"
          :items="toolheadMoveDistances"
          :rules="[rules.numRequired]"
          filled
          dense
          single-line
          hide-details
          suffix="mm"
          @change="setDefaultToolheadMoveLength"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.default_toolhead_xy_speed')">
        <v-text-field
          :value="defaultToolheadXYSpeed"
          :rules="[rules.numRequired, rules.numMin]"
          filled
          dense
          single-line
          hide-details
          suffix="mm/s"
          @change="setDefaultToolheadYXSpeed"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.default_toolhead_z_speed')">
        <v-text-field
          :value="defaultToolheadZSpeed"
          :rules="[rules.numRequired, rules.numMin]"
          filled
          dense
          single-line
          hide-details
          suffix="mm/s"
          @change="setDefaultToolheadZSpeed"
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
          multiple
          small-chips
          append-icon=""
          deletable-chips
          :rules="[
            v => v.length > 0 || $t('app.general.simple_form.error.min', { min: 1 }),
            v => v.length <= 6 || $t('app.general.simple_form.error.max', { max: 6 }),
            v => !v.some(isNaN) || $t('app.general.simple_form.error.arrayofnums')
          ]"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.z_adjust_values')">
        <v-combobox
          v-model="zAdjustValues"
          filled
          dense
          hide-selected
          hide-details="auto"
          multiple
          small-chips
          append-icon=""
          deletable-chips
          :rules="[
            v => v.length > 0 || $t('app.general.simple_form.error.min', { min: 1 }),
            v => v.length <= 4 || $t('app.general.simple_form.error.max', { max: 4 }),
            v => !v.some(isNaN) || $t('app.general.simple_form.error.arrayofnums')
          ]"
        />
      </app-setting>

      <v-divider />

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
import { Component, Ref, Vue } from 'vue-property-decorator'
import { defaultState } from '@/store/config/index'

@Component({
  components: {}
})
export default class ToolHeadSettings extends Vue {
  @Ref('toolheadMoveDistances') readonly toolheadMoveDistancesElement!: any;

  rules = {
    numRequired: (v: number | string) => v !== '' || 'Required',
    numMin: (v: number) => v >= 1 || 'Min 1'
  }

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

  set zAdjustValues (value: number[]) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.zAdjustDistances',
      value,
      server: true
    })
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
