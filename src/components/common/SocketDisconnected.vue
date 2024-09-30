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
        <div v-if="apiUrl">
          {{ apiUrl }}
        </div>
        <span v-if="socketConnecting || !appReady">{{ $t('app.socket.msg.connecting') }}</span>
        <span v-else>{{ $t('app.socket.msg.no_connection') }}</span>
      </v-col>
      <v-col
        cols="6"
        lg="4"
      >
        <v-progress-linear
          v-if="socketConnecting || !appReady"
          class="mb-4"
          color="warning"
          indeterminate
          rounded
          height="6"
        />

        <app-btn
          v-if="!socketConnecting && activeInstance"
          block
          color="info"
          class="me-2 mb-2"
          @click="reconnect()"
        >
          {{ $t('app.general.btn.socket_reconnect') }}
        </app-btn>

        <app-btn
          block
          color="warning"
          class="me-2 mb-2"
          @click="reload()"
        >
          {{ $t('app.general.btn.socket_refresh') }}
        </app-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { appInit } from '@/init'
import StateMixin from '@/mixins/state'

@Component({
  components: {}
})
export default class SocketDisconnected extends Mixins(StateMixin) {
  reload () {
    window.location.reload()
  }

  get activeInstance () {
    return this.$store.getters['config/getCurrentInstance']
  }

  get apiUrl () {
    return this.$store.state.config.apiUrl
  }

  async reconnect () {
    // Re-init the app.
    const config = await appInit(this.activeInstance, this.$store.state.config.hostConfig)

    // Reconnect the socket with the instance url.
    if (config.apiConfig.socketUrl && config.apiConnected && config.apiAuthenticated) {
      this.$socket.connect(config.apiConfig.socketUrl)
    }
  }
}
</script>
