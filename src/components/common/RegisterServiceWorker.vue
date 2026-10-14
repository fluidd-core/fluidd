<template>
  <m3-toast
    v-model="needRefresh"
    position="bottom"
    data-tid="needs-refresh"
  >
    {{ $t('app.general.msg.needs_refresh') }}
    <template #action>
      <button
        type="button"
        class="cbtn cbtn--primary"
        data-tid="needs-refresh-reload"
        @click="updateServiceWorker"
      >
        {{ $t('app.general.btn.reload') }}
      </button>
    </template>
  </m3-toast>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { consola } from 'consola'
import { EventBus } from '@/eventBus'
import M3Toast from '@/components/ui/M3Toast.vue'

@Component({ components: { M3Toast } })
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
