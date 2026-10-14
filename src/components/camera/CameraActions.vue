<template>
  <div
    v-if="hasCamera"
    class="camera-actions"
  >
    <button
      type="button"
      class="cbtn"
      data-tid="camera-snapshot"
      @click="send('camera-snapshot')"
    >
      <frame-icon
        name="camera2"
        small
      />
      Snapshot
    </button>
    <button
      type="button"
      class="cbtn"
      data-tid="camera-fullscreen"
      @click="send('camera-fullscreen')"
    >
      <frame-icon
        name="expand"
        small
      />
      Full screen
      <kbd
        v-if="!isMobileViewport"
        class="camera-actions__key"
      >F</kbd>
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import { EventBus } from '@/eventBus'

/** Camera's actions in the page header. The page takes the snapshot and fills the screen. */
@Component({})
export default class CameraActions extends Mixins(BrowserMixin) {
  get hasCamera (): boolean {
    return (this.$store.getters['webcams/getEnabledWebcams'] as unknown[]).length > 0
  }

  send (event: string) {
    EventBus.bus.$emit(event)
  }
}
</script>

<style lang="scss" scoped>
  .camera-actions {
    display: flex;
    gap: 8px;
  }

  .camera-actions__key {
    padding: 1px 6px;
    border-radius: 6px;
    background: var(--m3d-fill, rgba(255, 255, 255, 0.08));
    box-shadow: none;
    color: var(--m3d-text-muted);
    font-family: var(--m3d-font-mono, monospace);
    font-size: 11px;
  }
</style>
