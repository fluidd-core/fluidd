<template>
  <nav
    class="camera-tabs"
    aria-label="Cameras"
    data-tid="camera-tabs"
  >
    <router-link
      v-for="camera in cameras"
      :key="camera.uid"
      :to="cameraTo(camera)"
      class="camera-tabs__tab"
      :class="{ 'camera-tabs__tab--on': camera.uid === currentUid }"
      :aria-current="camera.uid === currentUid ? 'page' : undefined"
    >
      {{ camera.name }}
    </router-link>
    <router-link
      v-if="!isMobileViewport"
      :to="addTo"
      class="camera-tabs__tab camera-tabs__tab--add"
    >
      Add a camera
    </router-link>
  </nav>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import { cameraFor } from '@/services/camera/model'
import type { WebcamConfig } from '@/store/webcams/types'

/** Beside Camera's title: one tab per camera, and Add a camera, which opens Settings › Cameras. */
@Component({})
export default class CameraTabs extends Mixins(BrowserMixin) {
  get cameras (): WebcamConfig[] {
    return this.$store.getters['webcams/getEnabledWebcams'] as WebcamConfig[]
  }

  get currentUid (): string | null {
    return cameraFor(this.cameras, this.$route.params.cameraId)?.uid ?? null
  }

  cameraTo (camera: WebcamConfig): string {
    return scopedPath(`/camera/${encodeURI(camera.uid)}`, activeSlug())
  }

  get addTo (): string {
    return `${scopedPath('/settings', activeSlug())}#camera`
  }
}
</script>

<style lang="scss" scoped>
  .camera-tabs {
    display: flex;
    gap: 2px;
    min-width: 0;
    padding: 4px;
    overflow-x: auto;
    border-radius: 14px;
    background: var(--m3d-surface);
  }

  .camera-tabs__tab {
    flex: none;
    padding: 6px 14px;
    border-radius: 10px;
    color: var(--m3d-text-muted) !important;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;

    &:hover {
      color: var(--m3d-text) !important;
    }
  }

  .camera-tabs__tab--on {
    background: var(--m3d-surface-2);
    color: var(--m3d-text) !important;
  }

  .camera-tabs__tab--add {
    font-weight: 500;
  }
</style>
