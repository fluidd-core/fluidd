<template>
  <div
    class="vtog"
    role="group"
    aria-label="Show"
  >
    <button
      v-for="t in toggles"
      :key="t.key"
      type="button"
      class="vtog__chip"
      :class="{ 'vtog__chip--on': t.on }"
      :aria-pressed="t.on ? 'true' : 'false'"
      @click="setOption(t.key, !t.on)"
    >
      {{ t.label }}
    </button>
    <button
      type="button"
      class="vtog__chip"
      :class="{ 'vtog__chip--on': zoomed }"
      :aria-pressed="zoomed ? 'true' : 'false'"
      data-tid="job-viewer-zoom"
      @click="zoomed = !zoomed"
    >
      Zoom to the part
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import type { ViewerOptions } from '@/store/gcodePreview/types'

type Toggle = keyof Pick<ViewerOptions, 'showMoves' | 'showExtrusions' | 'showRetractions' | 'showPreviousLayer' | 'showNextLayer' | 'showParts'>

/**
 * What the G-code drawing shows, for Jobs' viewer and the full-screen one
 * alike: the preview store's options, and the saved zoom-to-the-part
 * setting, so both views draw the same.
 */
@Component({})
export default class ViewerToggles extends Vue {
  get toggles (): Array<{ key: Toggle, label: string, on: boolean }> {
    const option = (key: Toggle) => !!this.$store.getters['gcodePreview/getViewerOption'](key)
    const list: Array<[Toggle, string]> = [
      ['showExtrusions', 'Extrusions'],
      ['showMoves', 'Travel'],
      ['showRetractions', 'Retractions'],
      ['showPreviousLayer', 'Layer below'],
      ['showNextLayer', 'Layer above'],
      ['showParts', 'Objects']
    ]
    return list.map(([key, label]) => ({ key, label, on: option(key) }))
  }

  setOption (key: Toggle, value: boolean) {
    this.$store.commit('gcodePreview/setViewerState', { [key]: value })
  }

  get zoomed (): boolean {
    return !!this.$store.state.config.uiSettings.gcodePreview.autoZoom
  }

  set zoomed (value: boolean) {
    this.$store.dispatch('config/saveByPath', { path: 'uiSettings.gcodePreview.autoZoom', value, server: true })
  }
}
</script>

<style lang="scss" scoped>
  .vtog {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .vtog__chip {
    height: 32px;
    padding: 0 12px;
    border-radius: 999px;
    box-shadow: inset 0 0 0 1px var(--m3d-border-strong);
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .vtog__chip--on {
    background: rgba(128, 214, 209, 0.14);
    box-shadow: inset 0 0 0 1px rgba(128, 214, 209, 0.5);
    color: var(--m3d-accent);
  }
</style>
