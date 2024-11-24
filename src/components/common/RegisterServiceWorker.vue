<template>
  <div>
    <v-snackbar
      v-model="needRefresh"
      timeout="-1"
      multi-line
      elevation="24"
      bottom
      right
    >
      <span v-html="$t('app.general.msg.needs_refresh')" />
      <template #action="{ attrs }">
        <app-btn
          v-bind="attrs"
          @click="updateServiceWorker"
        >
          {{ $t('app.general.btn.reload') }}
        </app-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { consola } from 'consola'
import { EventBus } from '@/eventBus'

@Component({})
export default class RegisterServiceWorker extends Vue {
  updateSW: ((reloadPage?: boolean) => Promise<void>) | null = null
  needRefresh = false

  onOfflineReady () {
    consola.debug('[PWA] ready for offline work')
    EventBus.$emit(this.$tc('app.general.msg.offline_ready'), { timeout: 5000 })
  }

  onNeedRefresh () {
    consola.debug('[PWA] needs refresh')
    this.needRefresh = true
  }

  onRegistered (registration?: ServiceWorkerRegistration) {
    consola.debug('[PWA] registered', registration)
  }

  onRegisterError (e: unknown) {
    consola.error('[PWA] registration error', e)
  }

  updateServiceWorker () {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
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

<style lang="scss" scoped>
  :deep(.v-snack__wrapper .v-snack__content) {
    overflow: hidden;
    overflow-wrap: break-word;
  }
</style>
