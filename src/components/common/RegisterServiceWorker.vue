<template>
  <div>
    <v-snackbar
      v-model="open"
      :timeout="needRefresh ? undefined: 10000"
    >
      <span v-if="offlineReady">
        Fluidd is ready to work offline
      </span>
      <span v-else>
        New content available, please click on reload button to update.
      </span>
      <template
        v-if="needRefresh"
        #action="{ attrs }"
      >
        <v-btn
          text
          v-bind="attrs"
          @click="updateServiceWorker"
        >
          Reload
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import consola from 'consola'

@Component({})
export default class RegisterServiceWorker extends Vue {
  updateSW: ((reloadPage?: boolean) => Promise<void>) | null = null
  offlineReady = false
  needRefresh = false

  get open () {
    return this.offlineReady || this.needRefresh
  }

  set open (value: boolean) {
    this.offlineReady = false
    this.needRefresh = false
  }

  onOfflineReady () {
    consola.debug('[PWA] ready for offline work')
    this.offlineReady = true
  }

  onNeedRefresh () {
    consola.debug('[PWA] needs refresh')
    this.needRefresh = true
  }

  onRegistered (registration?: ServiceWorkerRegistration) {
    consola.debug('[PWA] registered', registration)
  }

  onRegisterError (e: any) {
    consola.error('[PWA] registration error', e)
  }

  updateServiceWorker () {
    this.updateSW && this.updateSW(true)
  }

  async mounted () {
    try {
      const { registerSW } = await import('virtual:pwa-register')

      this.updateSW = registerSW({
        immediate: true,
        onOfflineReady: this.onOfflineReady,
        onNeedRefresh: this.onNeedRefresh,
        onRegistered: this.onRegistered,
        onRegisterError: this.onRegisterError
      })
    } catch {
      consola.error('[PWA] disabled')
    }
  }
}
</script>
