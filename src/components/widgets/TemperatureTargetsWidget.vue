<template>
    <v-container fluid class="py-2 px-6">
      <v-row class="d-none d-sm-flex" v-if="klippyConnected">
        <v-col offset="4" class="py-0 px-2 text-subtitle-1 grey--text text--darken-1">
          Actual
        </v-col>
        <v-col class="py-0 px-2 text-subtitle-1 grey--text text--darken-1">
          <v-layout>
            Target
            <v-spacer></v-spacer>
            <!-- <v-menu bottom left :offset-y="true" :min-width="150">
              <template v-slot:activator="{ on, attrs }">
              <v-btn
                :min-width="40"
                v-bind="attrs" v-on="on"
                color="secondary"
                small
                class="pa-0">
                <v-icon>{{ icons.chevronDown }}</v-icon>
              </v-btn>
              </template>
              <v-list
                nav
                dense
                color="secondary">
                <v-list-item link>
                  <v-list-item-title>Off</v-list-item-title>
                </v-list-item>
                <v-list-item link>
                  <v-list-item-title>Preheat</v-list-item-title>
                </v-list-item>
                <v-list-item link>
                  <v-list-item-title>ABS</v-list-item-title>
                </v-list-item>
                <v-list-item link>
                  <v-list-item-title>PLA</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu> -->
          </v-layout>
        </v-col>
      </v-row>

      <v-row v-for="item in heaters" :key="item.name">
        <v-col cols="12" sm="4" class="py-1 px-2 text-subtitle-1 grey--text text--darken-1">
          {{ item.name }}
          <small class="ml-3" v-if="item.target === 0">off</small>
        </v-col>
        <v-col cols="6" sm="4" class="py-1 px-2 grey--text text--lighten-1 text-h5">
          {{ item.temperature.toFixed(1) }}<small>°C</small>
        </v-col>
        <v-col cols="6" sm="4" class="py-1 px-2">
          <input-temperature
            :value="item.target"
            @input="setHeaterTargetTemp(item, $event)"
            :max="item.maxTemp"
            :min="item.minTemp"
          ></input-temperature>
        </v-col>
      </v-row>

      <v-row v-for="item in fans" :key="item.name">
        <v-col cols="12" sm="4" class="py-1 px-2 text-subtitle-1 grey--text text--darken-1">
          {{ item.name }}
          <small class="ml-2" v-if="item.speed > 0 && item.target > 0">
            <v-icon
              color="grey darken-1"
              small
              v-if="item.target > 0">
              {{ icons.fan }}
            </v-icon>
            {{ (item.speed * 100).toFixed(0) }}%
          </small>

          <small class="ml-2" v-if="item.speed <= 0 && item.target > 0">
            standby
          </small>
          <small class="ml-2" v-if="item.speed <=0 && item.target <= 0">off</small>
        </v-col>
        <v-col cols="6" sm="4" class="py-1 px-2 grey--text text--lighten-1 text-h5">
          {{ item.temperature.toFixed(1) }}<small>°C</small>
        </v-col>
        <v-col cols="6" sm="4" class="py-1 px-2 grey--text text--lighten-1 text-h5">
          <input-temperature
            :value="item.target"
            @input="setFanTargetTemp(item, $event)"
            :max="item.maxTemp"
            :min="item.minTemp"
          ></input-temperature>
        </v-col>
      </v-row>

      <v-row v-for="item in sensors" :key="item.name">
        <v-col cols="12" sm="4" class="py-1 px-2 text-subtitle-1 grey--text text--darken-1">
          {{ item.name }}
        </v-col>
        <v-col cols="6" sm="4" class="py-1 px-2 grey--text text--lighten-1 text-h5">
          <v-tooltip right>
            <template v-slot:activator="{ on, attrs }">
              <span v-bind="attrs" v-on="on">{{ item.temperature.toFixed(1) }}<small>°C</small></span>
            </template>
            <span>
              <span class="blue--text text--lighten-4">{{ item.minMeasuredTemp.toFixed(1) }}°C&nbsp;&nbsp;</span>
              <span class="red--text text--lighten-2">{{ item.maxMeasuredTemp.toFixed(1) }}°C</span>
            </span>
          </v-tooltip>
        </v-col>
        <v-col cols="6" sm="4" class="py-1 px-2 grey--text text--lighten-1 text-h5">
        </v-col>
      </v-row>

    </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import InputTemperature from '@/components/inputs/InputTemperature.vue'
import UtilsMixin from '@/mixins/utils'
import { Fan, Heater } from '@/store/socket/types'

@Component({
  components: {
    InputTemperature
  }
})
export default class TemperatureTargetsWidget extends Mixins(UtilsMixin) {
  get extruder () {
    return this.$store.state.socket.printer.extruder
  }

  get heaters () {
    return this.$store.getters['socket/getHeaters']
  }

  get fans () {
    return this.$store.getters['socket/getFans']
  }

  get sensors () {
    return this.$store.getters['socket/getSensors']
  }

  setHeaterTargetTemp (item: Heater, target: number) {
    this.sendGcode(`SET_HEATER_TEMPERATURE HEATER=${item.name} TARGET=${target}`)
  }

  setFanTargetTemp (item: Fan, target: number) {
    this.sendGcode(`SET_TEMPERATURE_FAN_TARGET TEMPERATURE_FAN=${item.name} TARGET=${target}`)
  }
}
</script>
