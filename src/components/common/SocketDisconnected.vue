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
        <span v-if="socketDisconnected">{{ $t('app.socket.msg.no_connection') }}</span>
        <span v-else-if="retryHeld">{{ $t('app.socket.msg.unable_to_connect') }}</span>
        <span v-else-if="retrySeconds !== null">{{ $t('app.socket.msg.retrying_in', { seconds: retrySeconds }) }}</span>
        <span v-else>{{ $t('app.socket.msg.connecting') }}</span>
      </v-col>
      <v-col
        cols="6"
        lg="4"
      >
        <v-progress-linear
          v-if="!socketDisconnected && !waitingToRetry"
          class="mb-4"
          color="warning"
          indeterminate
          rounded
          height="6"
        />

        <app-btn
          v-if="waitingToRetry"
          block
          color="info"
          class="me-2 mb-2"
          @click="$socket.retryNow()"
        >
          {{ $t('app.general.btn.socket_retry_now') }}
        </app-btn>

        <app-btn
          v-if="socketDisconnected && activeInstance"
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
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { appInit } from '@/init'
import StateMixin from '@/mixins/state'
import type { InstanceConfig } from '@/store/config/types'
import type { SocketRetry } from '@/store/socket/types'

@Component({
  components: {}
})
export default class SocketDisconnected extends Mixins(StateMixin) {
  now = Date.now()
  nowInterval: ReturnType<typeof setInterval> | null = null

  beforeDestroy () {
    this.stopNowInterval()
  }

  reload () {
    window.location.reload()
  }

  get activeInstance (): InstanceConfig | undefined {
    return this.$typedGetters['config/getCurrentInstance']
  }

  get retry (): SocketRetry | null {
    return this.$typedState.socket.retry
  }

  get retryAt (): number | null {
    return this.retry !== null && 'at' in this.retry
      ? this.retry.at
      : null
  }

  get retryHeld (): boolean {
    return this.retry !== null && 'held' in this.retry
  }

  @Watch('retryAt', { immediate: true })
  onRetryAtChanged (retryAt: number | null) {
    this.stopNowInterval()
    this.now = Date.now()

    if (retryAt !== null) {
      this.nowInterval = setInterval(() => {
        this.now = Date.now()
      }, 1000)
    }
  }

  stopNowInterval () {
    if (this.nowInterval !== null) {
      clearInterval(this.nowInterval)
      this.nowInterval = null
    }
  }

  get retrySeconds (): number | null {
    const retryAt = this.retryAt

    return retryAt !== null
      ? Math.max(0, Math.ceil((retryAt - this.now) / 1000))
      : null
  }

  get waitingToRetry (): boolean {
    return this.retry !== null
  }

  get apiUrl (): string {
    return this.$typedState.config.apiUrl
  }

  async reconnect () {
    await appInit(this.activeInstance, this.$typedState.config.hostConfig)
  }
}
</script>
