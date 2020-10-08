<template>
  <v-sheet color="#262626">
    <v-container class="py-2">
      <v-row>
        <v-col offset="4" class="py-1 px-2 text-subtitle-1 grey--text text--darken-1">
          Actual
        </v-col>
        <v-col class="py-1 px-2 text-subtitle-1 grey--text text--darken-1">
          Target
          <v-menu bottom :offset-y="true">
            <template v-slot:activator="{ on, attrs }">
              <v-btn small v-bind="attrs" v-on="on" icon color="grey"><v-icon>mdi-chevron-down</v-icon></v-btn>
            </template>
            <v-list nav dense transition="slide-y-transition">
              <v-list-item>
                <v-list-item-title>Off</v-list-item-title>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Set ABS</v-list-item-title>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Set PLA</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-col>
      </v-row>
      <v-row v-for="item in heaters" :key="item.name">
        <v-col class="py-1 px-2 text-subtitle-1 grey--text text--darken-1">
          {{ item.name }}
          <small class="ml-3" v-if="item.target === 0">off</small>
        </v-col>
        <v-col class="py-1 px-2 grey--text text--lighten-1 text-h5">
          {{ item.temperature.toFixed(1) }}
          <small>°C</small>
        </v-col>
        <v-col class="py-1 px-2">
          <input-temperature
            :value="item.target"
            @input="setHeaterTargetTemp(item, $event)"
            :max="item.maxTemp"
            :min="item.minTemp"
          ></input-temperature>
        </v-col>
      </v-row>
      <v-row v-for="item in fans" :key="item.name">
        <v-col class="py-1 px-2 text-subtitle-1 grey--text text--darken-1">
          {{ item.name }}
          <small class="ml-2" v-if="item.speed > 0 && item.target > 0">
            <v-icon
              color="grey darken-1"
              small
              v-if="item.target > 0">
              mdi-fan mdi-spin
            </v-icon>
            {{ (item.speed * 100).toFixed(0) }}%
          </small>

          <small class="ml-2" v-if="item.speed <= 0 && item.target > 0">
            standby
          </small>
          <small class="ml-2" v-if="item.speed <=0 && item.target <= 0">off</small>
        </v-col>
        <v-col class="py-1 px-2 grey--text text--lighten-1 text-h5">
          {{ item.temperature.toFixed(1) }}
          <small>°C</small>
        </v-col>
        <v-col class="py-1 px-2 grey--text text--lighten-1 text-h5">
          <input-temperature
            :value="item.target"
            @input="setFanTargetTemp(item, $event)"
            :max="item.maxTemp"
            :min="item.minTemp"
          ></input-temperature>
        </v-col>
      </v-row>
    </v-container>
  </v-sheet>
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

  setHeaterTargetTemp (item: Heater, target: number) {
    this.sendGcode(`SET_HEATER_TEMPERATURE HEATER=${item.name} TARGET=${target}`)
  }

  setFanTargetTemp (item: Fan, target: number) {
    this.sendGcode(`SET_TEMPERATURE_FAN_TARGET TEMPERATURE_FAN=${item.name} TARGET=${target}`)
  }

  mounted () {
    // setTimeout(() => {}, 3000)
  }
}
</script>

<style type="scss" scoped>

</style>
