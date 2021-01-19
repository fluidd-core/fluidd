<template>
  <div>
    <v-subheader id="toolhead">{{ $t('Toolhead') }}</v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4">
      <v-list
        color="transparent"
      >
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>{{ $t('Invert X control') }}</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-switch
              v-model="invertX"
              class="mt-0 mb-4"
            >
            </v-switch>
          </v-list-item-action>
        </v-list-item>

        <v-divider />

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>{{ $t('Invert Y control') }}</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-switch
              v-model="invertY"
              class="mt-0 mb-4"
            >
            </v-switch>
          </v-list-item-action>
        </v-list-item>

        <v-divider />

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>{{ $t('Invert Z control') }}</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-switch
              v-model="invertZ"
              class="mt-0 mb-4"
            >
            </v-switch>
          </v-list-item-action>
        </v-list-item>

        <v-divider />

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>
              {{ $t('Use GCode Coordinates') }}
              <inline-help
                small
                top
                :tooltip="$t('Use GCode position instead of toolhead position on dashboard')"
              ></inline-help>
            </v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-switch
              v-model="useGcodeCoords"
              class="mt-0 mb-4"
            >
            </v-switch>
          </v-list-item-action>
        </v-list-item>

        <v-divider />

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>{{ $t('Default extrude length') }}</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-text-field
              :value="defaultExtrudeLength"
              @change="setDefaultExtrudeLength"
              :rules="[rules.numRequired, rules.numMin]"
              filled
              dense
              single-line
              hide-details
              suffix="mm"
            ></v-text-field>
          </v-list-item-action>
        </v-list-item>

        <v-divider />

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>{{ $t('Default extrude speed') }}</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-text-field
              :value="defaultExtrudeSpeed"
              @change="setDefaultExtrudeSpeed"
              :rules="[rules.numRequired, rules.numMin]"
              filled
              dense
              single-line
              hide-details
              suffix="mm/s"
            ></v-text-field>
          </v-list-item-action>
        </v-list-item>

        <v-divider />

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>{{ $t('Default toolhead move length') }}</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-select
              :value="defaultToolheadMoveLength"
              :items="[0.1, 1.0, 10, 100]"
              @change="setDefaultToolheadMoveLength"
              :rules="[rules.numRequired, rules.numMin]"
              filled
              dense
              single-line
              hide-details
              suffix="mm"
            ></v-select>
          </v-list-item-action>
        </v-list-item>

        <v-divider />

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>{{ $t('Default toolhead XY speed') }}</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-text-field
              :value="defaultToolheadXYSpeed"
              @change="setDefaultToolheadYXSpeed"
              :rules="[rules.numRequired, rules.numMin]"
              filled
              dense
              single-line
              hide-details
              suffix="mm/s"
            ></v-text-field>
          </v-list-item-action>
        </v-list-item>

        <v-divider />

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>{{ $t('Default toolhead Z speed') }}</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-text-field
              :value="defaultToolheadZSpeed"
              @change="setDefaultToolheadZSpeed"
              :rules="[rules.numRequired, rules.numMin]"
              filled
              dense
              single-line
              hide-details
              suffix="mm/s"
            ></v-text-field>
          </v-list-item-action>
        </v-list-item>

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title class="text-wrap">{{ $t('Z Adjust values') }}</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
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
              type="number"
              :rules="[
                  v => v.length > 0 || $t('Minimum 1 value'),
                  v => v.length <= 2 || $t('Max 2 values.'),
              ]"
            ></v-combobox>
          </v-list-item-action>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>{{ $t('Reset settings') }}</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <btn
              outlined
              small
              color="primary"
              @click="handleReset"
            >
              {{ $t('Reset') }}
            </btn>
          </v-list-item-action>
        </v-list-item>

      </v-list>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { defaultState } from '@/store/config/index'

@Component({
  components: {}
})
export default class ToolHeadSettingsCard extends Vue {
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
      hideTempWaits: current.hideTempWaits,
      printTimeEstimationsType: current.printTimeEstimationsType
    }
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general',
      value,
      server: true
    })
  }
}
</script>
