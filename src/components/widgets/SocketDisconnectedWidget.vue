<template>
  <v-container style="height: 400px;">
    <v-row
      class="fill-height"
      align-content="center"
      justify="center"
    >
      <v-col
        class="subtitle-1 text-center"
        cols="12"
      >
        Connecting to printer...
      </v-col>
      <v-col cols="6">
        <v-progress-linear
          class="mb-4"
          color="warning"
          indeterminate
          rounded
          height="6"
        ></v-progress-linear>
        <v-btn block color="warning" @click="reload()" class="me-2 mb-2">Force Refresh</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {}
})
export default class SocketDisconnectedWidget extends Mixins(UtilsMixin) {
  reload () {
    window.location.reload()
  }
}
</script>
