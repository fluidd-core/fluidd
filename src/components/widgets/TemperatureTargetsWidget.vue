<template>
  <v-card-text>
    <v-row>
      <v-col class="text-subtitle-1 grey--text text--darken-1 d-none d-sm-flex">
        Item
      </v-col>
      <v-col cols="2" class="text-subtitle-1 grey--text text--darken-1 d-none d-sm-flex">
        Power
      </v-col>
      <v-col cols="6" sm="3" class="text-subtitle-1 grey--text text--darken-1">
        Current
      </v-col>
      <v-col sm="4" class="text-subtitle-1 grey--text text--darken-1">
        <v-layout>
          <span class="">Target</span>
          <v-spacer></v-spacer>
          <v-menu bottom left offset-y :min-width="150">
            <template v-slot:activator="{ on, attrs }">
            <btn
              :min-width="40"
              :disabled="!klippyReady"
              v-bind="attrs" v-on="on"
              color="secondary"
              small
              class="pa-0">
              <v-icon>$menuAlt</v-icon>
            </btn>
            </template>
            <v-list
              dense
              color="secondary">
              <v-list-item
                @click="setAllOff"
                link>
                <v-list-item-title>
                  <v-icon small left color="cyan">$snowflakeAlert</v-icon>
                  All off
                </v-list-item-title>
              </v-list-item>
              <v-list-item
                link
                dense
                @click="applyPreset(preset)"
                v-for="(preset) of presets"
                :key="preset.index">
                <v-list-item-title>
                  <v-icon small left color="primary">$fire</v-icon>
                  {{ preset.name }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-layout>
      </v-col>
    </v-row>

    <v-row v-for="item in heaters" :key="item.name" align="center" class="mt-0">
      <v-col cols="6" sm="auto" class="pr-0 d-none d-sm-flex">
        <v-icon
          small
          :color="item.color">
          $fire
        </v-icon>
      </v-col>
      <v-col cols="6" sm="" class="text-subtitle-1 grey--text text--darken-1 pb-0 pb-md-2">
        <span
          @click="$emit('legendClick', item)"
          :class="{ 'active': chartSelectedLegends[item.name] }"
          class="legend-item">
          {{ item.prettyName }}
        </span>
      </v-col>
      <v-col cols="6" sm="2" class="grey--text pb-0 pb-md-2">
        <span
          @click="$emit('legendPowerClick', item)"
          :class="{ 'active': chartSelectedLegends[item.name + 'Power'] }"
          class="legend-item">
          <span v-if="item.power <= 0 && item.target <= 0">off</span>
          <span v-if="item.target > 0">
            {{ (item.power * 100).toFixed() }}<small>%</small>
          </span>
        </span>
      </v-col>
      <v-col cols="6" sm="3" class="grey--text focus--text pt-0 pt-md-2">
        {{ item.temperature.toFixed(1) }}<small>°C</small>
      </v-col>
      <v-col cols="6" sm="4" class="pt-0 pt-md-2">
        <input-temperature
          :value="item.target"
          @input="setHeaterTargetTemp(item.name, $event)"
          :max="item.maxTemp"
          :min="item.minTemp"
        ></input-temperature>
      </v-col>
    </v-row>

    <template v-for="item in fans">
      <v-row :key="item.name" align="center" class="mt-0">
        <v-col cols="6" sm="auto" class="pr-0 d-none d-md-flex">
          <v-icon
            small
            :class="{ 'spin': item.speed > 0 && item.target > 0 }"
            :color="item.color">
            $fan
          </v-icon>
        </v-col>
        <v-col cols="6" sm="" class="text-subtitle-1 grey--text text--darken-1 pb-0 pb-md-2">
          <span
            @click="$emit('legendClick', item)"
            :class="{ 'active': chartSelectedLegends[item.name] }"
            class="legend-item">
            {{ item.prettyName }}
          </span>
        </v-col>
        <v-col cols="5" sm="2" class="grey--text pb-0 pb-md-2">
          <span
            @click="$emit('legendPowerClick', item)"
            :class="{ 'active': chartSelectedLegends[item.name + 'Speed'] }"
            class="legend-item">
            <span v-if="item.speed > 0 && (item.target > 0 || !item.target)">
              {{ (item.speed * 100).toFixed(0) }}<small>%</small>
            </span>
            <span v-if="item.speed <= 0 && item.target && item.target > 0">
              standby
            </span>
            <span v-if="item.speed <=0 && ((item.target && item.target <= 0) || !item.target)">off</span>
          </span>
        </v-col>
        <v-col v-if="item.temperature" cols="6" sm="3" class="grey--text focus--text pt-0 pt-md-2">
          {{ item.temperature.toFixed(1) }}<small>°C</small>
        </v-col>
        <v-col v-if="item.type === 'temperature_fan'" cols="6" sm="4" class="pt-0 pt-md-2">
          <input-temperature
            :value="item.target"
            @input="setFanTargetTemp(item.name, $event)"
            :max="item.maxTemp"
            :min="item.minTemp"
          ></input-temperature>
        </v-col>
      </v-row>
    </template>

    <v-row v-for="item in sensors" :key="item.name" align="center" class="mt-0">
      <v-col cols="auto" class="pr-0 d-none d-sm-flex">
        <v-icon
          small
          :color="item.color">
          $thermometer
        </v-icon>
      </v-col>
      <v-col class="text-subtitle-1 grey--text text--darken-1">
        <span
          @click="$emit('legendClick', item)"
          :class="{ 'active': chartSelectedLegends[item.name] }"
          class="legend-item">
          {{ item.prettyName }}
        </span>
      </v-col>
      <v-col cols="6" sm="7" class="grey--text focus--text">
        <v-tooltip right>
          <template v-slot:activator="{ on, attrs }">
            <span v-bind="attrs" v-on="on">{{ item.temperature.toFixed(1) }}<small>°C</small></span>
          </template>
          <span>
            <span class="amber--text">high {{ item.measured_max_temp.toFixed(1) }}°C</span><br />
            <span class="cyan--text">low {{ item.measured_min_temp.toFixed(1) }}°C</span>
          </span>
        </v-tooltip>
      </v-col>
    </v-row>

    <!-- <div v-for="(group, key) in colors" :key="key">
      <pre>{{ key }}</pre>
      <div v-for="(value, i) in group" :key="i">
        <v-icon x-large :color="value.color">$fire</v-icon> {{ value.name }}
      </div>
    </div> -->

  </v-card-text>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import InputTemperature from '@/components/inputs/InputTemperature.vue'
import StateMixin from '@/mixins/state'
import { TemperaturePreset } from '@/store/config/types'

@Component({
  components: {
    InputTemperature
  }
})
export default class TemperatureTargetsWidget extends Mixins(StateMixin) {
  get colors () {
    return this.$colorset.colorList
  }

  get extruder () {
    return this.$store.state.printer.printer.extruder
  }

  get heaters () {
    return this.$store.getters['printer/getHeaters']
  }

  get fans () {
    return this.$store.getters['printer/getOutputs'](['temperature_fan'])
  }

  get sensors () {
    return this.$store.getters['printer/getSensors']
  }

  get presets () {
    return this.$store.getters['config/getTempPresets']
  }

  get chartableSensors () {
    return this.$store.getters['printer/getChartableSensors']
  }

  get chartSelectedLegends () {
    return this.$store.getters['charts/getSelectedLegends']
  }

  setHeaterTargetTemp (heater: string, target: number) {
    this.sendGcode(`SET_HEATER_TEMPERATURE HEATER=${heater} TARGET=${target}`)
  }

  setFanTargetTemp (fan: string, target: number) {
    this.sendGcode(`SET_TEMPERATURE_FAN_TARGET TEMPERATURE_FAN=${fan} TARGET=${target}`)
  }

  applyPreset (preset: TemperaturePreset) {
    if (preset && preset.values) {
      for (const key in preset.values) {
        const item = preset.values[key]
        if (item.type === 'heater' && item.active && item.value > -1) {
          this.setHeaterTargetTemp(key, item.value)
        }
        if (item.type === 'fan' && item.active && item.value > -1) {
          this.setFanTargetTemp(key, item.value)
        }
      }
    }
  }

  setAllOff () {
    this.sendGcode('TURN_OFF_HEATERS')
  }
}
</script>

<style lang="scss" scoped>
  .legend-item {
    display: inline-block;
    cursor: pointer;
    opacity: 0.5
  }

  .legend-item.active {
    opacity: 1
  }
</style>
