<template>
  <section
    class="deletion-banner lib-surface"
    role="status"
    aria-live="polite"
    data-tid="deletion-banner"
  >
    <div class="deletion-banner__text">
      <b>Deletion pending</b>
      <span>Your account will be deleted on {{ day }}. Until then you can keep it.</span>
    </div>
    <div class="deletion-banner__actions">
      <button
        type="button"
        class="lib-btn lib-btn--sm lib-btn--pri"
        :disabled="busy"
        data-tid="deletion-keep"
        @click="keep"
      >
        Keep my account
      </button>
    </div>
    <p
      v-if="error"
      class="acct-error deletion-banner__error"
      role="alert"
    >
      {{ error }}
    </p>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { deletionState } from '@/services/muon-cloud/deletion'
import { accountApi } from '@/services/account/api'
import { describe, loadMe } from '@/services/account/state'
import { dayText } from '@/services/account/model'
import { refreshPrinters } from '@/services/muon-cloud/state'
import '@/scss/muon3d-account.scss'

@Component({})
export default class DeletionBanner extends Vue {
  busy = false
  error = ''

  created () {
    loadMe().catch(() => {})
  }

  get day (): string {
    return deletionState.deleteAfter === null ? '' : dayText(deletionState.deleteAfter)
  }

  async keep () {
    if (this.busy) return
    this.busy = true
    this.error = ''
    try {
      await accountApi.cancelDeletion()
      await Promise.allSettled([loadMe(), refreshPrinters()])
    } catch (error) {
      this.error = describe(error)
      // Another browser may already have kept it; GET /me is allowed while suspended.
      loadMe().catch(() => {})
    } finally {
      this.busy = false
    }
  }
}
</script>

<style lang="scss" scoped>
.deletion-banner {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 20px;
  padding: 16px;
  margin-bottom: 16px;
}
.deletion-banner__text {
  display: flex;
  flex: 1 1 220px;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  span { color: var(--m3d-text-muted); }
}
.deletion-banner__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.deletion-banner__error { flex-basis: 100%; margin: 0; }
</style>
