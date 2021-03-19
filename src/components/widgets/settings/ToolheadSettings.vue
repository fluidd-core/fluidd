<template>
  <div>
    <v-subheader id="toolhead">Toolhead</v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4">
      <v-list
        color="transparent"
      >
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>Invert X control</v-list-item-title>
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
            <v-list-item-title>Invert Y control</v-list-item-title>
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
            <v-list-item-title>Invert Z control</v-list-item-title>
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
              Use GCode Coordinates
              <inline-help
                small
                top
                tooltip="Use GCode position instead of toolhead position on dashboard"
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
            <v-list-item-title>Default extrude length</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-text-field
              v-model.number="defaultExtrudeLength"
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
            <v-list-item-title>Default extrude speed</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-text-field
              v-model.number="defaultExtrudeSpeed"
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
            <v-list-item-title>Default toolhead move length</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-select
              v-model.number="defaultToolheadMoveLength"
              :items="['0.1', '1.0', '10', '100']"
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
            <v-list-item-title>Default toolhead XY speed</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-text-field
              v-model.number="defaultToolheadXYSpeed"
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
            <v-list-item-title>Default toolhead Z speed</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-text-field
              v-model.number="defaultToolheadZSpeed"
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
            <v-list-item-title>Z Adjust values</v-list-item-title>
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
                  v => v.length > 0 || 'Minimum 1 value',
                  v => v.length <= 2 || 'Max 2 values.',
              ]"
            ></v-combobox>
          </v-list-item-action>
        </v-list-item>

      </v-list>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Debounce } from 'vue-debounce-decorator'

const debounceTime = 250

@Component({
  components: {}
})
export default class ToolHeadSettingsCard extends Mixins(StateMixin) {
  defaultExtrudeSpeed = this.$store.state.config.uiSettings.general.defaultExtrudeSpeed
  defaultExtrudeLength = this.$store.state.config.uiSettings.general.defaultExtrudeLength
  defaultToolheadMoveLength = this.$store.state.config.uiSettings.general.defaultToolheadMoveLength
  defaultToolheadXYSpeed = this.$store.state.config.uiSettings.general.defaultToolheadXYSpeed
  defaultToolheadZSpeed = this.$store.state.config.uiSettings.general.defaultToolheadZSpeed

  @Watch('defaultExtrudeSpeed')
  @Debounce(debounceTime)
  onDefaultExtrudeSpeed (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.defaultExtrudeSpeed',
      value,
      server: true
    })
  }

  @Watch('defaultExtrudeLength')
  @Debounce(debounceTime)
  onDefaultExtrudeLength (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.defaultExtrudeLength',
      value,
      server: true
    })
  }

  @Watch('defaultToolheadMoveLength')
  @Debounce(debounceTime)
  onDefaultToolheadMoveLength (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.defaultToolheadMoveLength',
      value,
      server: true
    })
  }

  @Watch('defaultToolheadXYSpeed')
  @Debounce(debounceTime)
  onDefaultToolheadXYSpeed (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.defaultToolheadXYSpeed',
      value,
      server: true
    })
  }

  @Watch('defaultToolheadZSpeed')
  @Debounce(debounceTime)
  onDefaultToolheadZSpeed (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.defaultToolheadZSpeed',
      value,
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
}
</script>
