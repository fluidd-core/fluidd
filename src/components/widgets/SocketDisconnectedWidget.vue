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
        <span v-if="socketConnecting">{{$t('app.connection.try')}}</span>
        <span v-if="!socketConnecting">{{$t('app.connection.fail')}}</span>
      </v-col>
      <v-col cols="6">
        <v-progress-linear
          v-if="socketConnecting"
          class="mb-4"
          color="warning"
          indeterminate
          rounded
          height="6"
        ></v-progress-linear>
        <btn block color="warning" :elevation="2" @click="reload()" class="me-2 mb-2">{{$t('app.btn.forceRefresh')}}</btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({
  components: {}
})
export default class SocketDisconnectedWidget extends Mixins(StateMixin) {
  reload () {
    window.location.reload()
  }
}
</script>
