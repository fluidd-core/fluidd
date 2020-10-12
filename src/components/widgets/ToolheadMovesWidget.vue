<template>
  <v-container>
    <v-row>
      <v-col class="pa-2 pt-0" offset="3">
        <v-btn @click="sendMoveGcode('Y', toolheadMoveLength)" :disabled="hasWaits || !xyHomed" :min-width="40" class="pa-0" color="secondary"><v-icon>{{ icons.up }}</v-icon></v-btn>
      </v-col>
      <v-col class="pa-2 pt-0" offset="3">
        <v-btn @click="sendMoveGcode('Z', toolheadMoveLength)" :disabled="hasWaits || !zHomed" :min-width="40" class="pa-0"  color="secondary"><v-icon>{{ icons.up }}</v-icon></v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col class="pa-2">
        <v-btn @click="sendMoveGcode('X', '-' + toolheadMoveLength)" :disabled="hasWaits || !xyHomed" :min-width="40" class="pa-0"  color="secondary"><v-icon>{{ icons.left }}</v-icon></v-btn>
      </v-col>
      <v-col class="pa-2">
        <v-btn @click="sendGcode('G28 X Y', waits.onHomeXY)" :loading="hasWait(waits.onHomeXY)" :disabled="hasWaits" :min-width="40" class="pa-0" :color="(!xyHomed) ? 'warning' : 'secondary'"><v-icon>{{ icons.home }}</v-icon></v-btn>
      </v-col>
      <v-col class="pa-2">
        <v-btn @click="sendMoveGcode('X', toolheadMoveLength)" :disabled="hasWaits || !xyHomed" :min-width="40" class="pa-0"  color="secondary"><v-icon>{{ icons.right }}</v-icon></v-btn>
      </v-col>
      <v-col class="pa-2">
        <v-btn @click="sendGcode('G28 Z', waits.onHomeZ)" :loading="hasWait(waits.onHomeZ)" :disabled="hasWaits" :min-width="40" class="pa-0" :color="(!zHomed) ? 'warning' : 'secondary'"><v-icon>{{ icons.home }}</v-icon></v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col class="pa-2" offset="3">
        <v-btn @click="sendMoveGcode('Y', '-' + toolheadMoveLength)" :disabled="hasWaits || !xyHomed" :min-width="40" class="pa-0"  color="secondary"><v-icon>{{ icons.down }}</v-icon></v-btn>
      </v-col>
      <v-col class="pa-2" offset="3">
        <v-btn @click="sendMoveGcode('Z', '-' + toolheadMoveLength)" :disabled="hasWaits || !zHomed" :min-width="40" class="pa-0"  color="secondary"><v-icon>{{ icons.down }}</v-icon></v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col class="pa-2">
        <v-btn-toggle mandatory dense v-model="toolheadMoveLength">
          <v-btn :min-width="52" color="secondary" value="0.1">0.1</v-btn>
          <v-btn :min-width="52" class="pa-0" color="secondary" value="1.0">1.0</v-btn>
          <v-btn :min-width="52" class="pa-0" color="secondary" value="10">10</v-btn>
          <v-btn :min-width="52" class="pa-0" color="secondary" value="100">100</v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import { Waits } from '@/globals'

@Component({})
export default class ToolheadMovesWidget extends Mixins(UtilsMixin) {
  waits = Waits
  moveLength = ''

  get toolheadMoveLength () {
    return (this.moveLength === '')
      ? this.$store.state.config.fileConfig.general.defaultToolheadMoveLength
      : this.moveLength
  }

  set toolheadMoveLength (val: string) {
    this.moveLength = val
  }
}
</script>

<style type="scss" scoped>
</style>
