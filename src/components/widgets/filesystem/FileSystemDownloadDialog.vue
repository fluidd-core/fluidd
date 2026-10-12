<template>
  <m3-toast
    :value="open"
    position="bottom"
    :closable="false"
    data-tid="download-progress"
  >
    <div
      v-if="currentDownload"
      class="dl"
    >
      <span class="dl__title">Downloading {{ name }}</span>
      <div class="dl__bar">
        <span :style="{ width: `${currentDownload.percent}%` }" />
      </div>
      <span class="dl__facts">
        {{ currentDownload.percent }}% · {{ $filters.getReadableFileSizeString(currentDownload.loaded) }} of {{ $filters.getReadableFileSizeString(currentDownload.size) }} · {{ $filters.getReadableDataRateString(currentDownload.speed) }}
      </span>
    </div>
    <template #action>
      <button
        type="button"
        class="cbtn"
        data-tid="download-cancel"
        @click="handleCancelDownload"
      >
        {{ $t('app.general.btn.cancel') }}
      </button>
    </template>
  </m3-toast>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { FileDownload } from '@/store/files/types'
import M3Toast from '@/components/ui/M3Toast.vue'

/** A file coming down from the printer: how far, how fast, and Cancel. */
@Component({ components: { M3Toast } })
export default class FileSystemDownloadDialog extends Mixins(StateMixin) {
  open = false

  created () {
    this.open = !!this.currentDownload
  }

  @Watch('currentDownload')
  onCurrentDownloadChange (val: FileDownload | null) {
    this.open = !!val
  }

  get currentDownload (): FileDownload | null {
    return this.$store.state.files.download
  }

  get name (): string {
    const path = this.currentDownload?.filepath ?? ''
    return path.split('/').pop() || path
  }

  handleCancelDownload () {
    this.currentDownload?.abortController.abort()
  }
}
</script>

<style lang="scss" scoped>
  .dl {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: min(320px, 60vw);
  }

  .dl__title {
    overflow: hidden;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dl__bar {
    height: 4px;
    border-radius: 2px;
    background: var(--m3d-surface-2);
    overflow: hidden;

    span {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--m3d-accent);
      transition: width var(--m3d-duration-base) linear;
    }
  }

  .dl__facts {
    color: var(--m3d-text-muted);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }
</style>
