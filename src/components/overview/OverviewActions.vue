<template>
  <div
    class="ov-actions"
    data-tid="overview-actions"
  >
    <template v-if="busy">
      <button
        type="button"
        class="ov-actions__btn"
        :disabled="!klippyReady"
        data-tid="overview-pause"
        @click="printerPaused ? resumePrint() : pausePrint()"
      >
        <v-icon small>
          {{ printerPaused ? '$resume' : '$pause' }}
        </v-icon>
        {{ printerPaused ? 'Resume' : 'Pause' }}
      </button>
      <button
        type="button"
        class="ov-actions__btn ov-actions__btn--danger"
        :disabled="!klippyReady"
        data-tid="overview-stop"
        @click="cancelPrint()"
      >
        <v-icon small>
          $stop
        </v-icon>
        Stop print
      </button>
    </template>
    <template v-else>
      <button
        type="button"
        class="ov-actions__btn"
        :disabled="!socketConnected"
        data-tid="overview-upload"
        @click="upload"
      >
        <frame-icon
          name="upload"
          small
        />
        Upload
      </button>
      <router-link
        class="ov-actions__btn ov-actions__btn--primary"
        :to="jobsPath"
        data-tid="overview-print-a-file"
      >
        <v-icon small>
          $play
        </v-icon>
        Print a file
      </router-link>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { EventBus } from '@/eventBus'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'

/** Overview's page actions: Pause and Stop while it prints; Upload and Print a file when it doesn't. */
@Component({})
export default class OverviewActions extends Mixins(StateMixin) {
  get busy (): boolean {
    return this.printerPrinting || this.printerPaused
  }

  get jobsPath (): string {
    return scopedPath('/jobs', activeSlug())
  }

  upload () {
    EventBus.bus.$emit('upload-file')
  }
}
</script>

<style lang="scss" scoped>
  .ov-actions {
    display: flex;
    gap: 8px;
  }

  .ov-actions__btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 40px;
    padding: 0 16px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text) !important;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;

    .v-icon {
      color: inherit !important;
    }

    &:disabled {
      opacity: 0.45;
      cursor: default;
    }
  }

  .ov-actions__btn--primary {
    background: var(--m3d-accent);
    color: var(--m3d-on-accent, #00201e) !important;
  }

  .ov-actions__btn--danger {
    background: color-mix(in srgb, var(--m3d-danger) 16%, transparent);
    color: var(--m3d-danger) !important;
  }
</style>
