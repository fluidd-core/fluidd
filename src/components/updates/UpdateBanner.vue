<template>
  <router-link
    :to="to"
    class="upbar"
    data-tid="update-banner"
  >
    <span class="upbar__dot" />
    <span class="upbar__text">{{ text }}</span>
    <span
      v-if="percent !== null"
      class="upbar__bar"
    ><i :style="{ width: `${percent}%` }" /></span>
    <span class="upbar__go">See progress</span>
  </router-link>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { updateWatch } from '@/services/updates/watch'
import { versionLabel } from '@/services/updates/model'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'

/** On every page while the printer installs an update: how far it is, and the way to the Updating page. */
@Component({})
export default class UpdateBanner extends Vue {
  get percent (): number | null {
    const p = updateWatch.remembered?.phase === 'installing' ? updateWatch.remembered.progress : null
    return typeof p === 'number' ? Math.round(Math.max(0, Math.min(100, p))) : null
  }

  get text (): string {
    const r = updateWatch.remembered
    const to = r?.to ? ` (${versionLabel(r.to).text.split(' · ')[0]})` : ''
    if (r?.phase === 'verifying') return 'Verifying update'
    if (r?.phase === 'rebooting') return 'Restarting'
    return `Installing update${to}${this.percent !== null ? `: ${this.percent}%` : ''}`
  }

  get to (): string {
    return scopedPath('/updating', activeSlug())
  }
}
</script>

<style lang="scss" scoped>
  .upbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0 0 16px;
    padding: 10px 16px;
    border-radius: 14px;
    background: var(--m3d-accent-soft, rgb(128 214 209 / 14%));
    color: var(--m3d-text) !important;
    font-size: 14px;
    text-decoration: none;
  }

  .upbar__dot {
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--m3d-accent);
    animation: upbar-pulse 1.2s ease-in-out infinite;
  }

  @keyframes upbar-pulse {
    50% { opacity: 0.35; }
  }

  .upbar__text {
    flex: 1 1 auto;
    min-width: 0;
    font-weight: 600;
  }

  .upbar__bar {
    flex: 0 0 160px;
    height: 6px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--m3d-surface-2);

    i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--m3d-accent);
      transition: width 0.6s var(--m3d-ease, ease);
    }
  }

  .upbar__go {
    color: var(--m3d-accent);
    font-size: 13px;
    font-weight: 600;
  }
</style>
