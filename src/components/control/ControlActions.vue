<template>
  <div
    class="control-actions"
    data-tid="control-actions"
  >
    <button
      type="button"
      class="cbtn"
      :disabled="!controlReady || busy"
      data-tid="home-all"
      title="G28"
      @click="home()"
    >
      <v-progress-circular
        v-if="homing()"
        indeterminate
        size="14"
        width="2"
      />
      <frame-icon
        v-else
        name="home"
        small
      />
      Home all
    </button>
    <button
      type="button"
      class="cbtn"
      :disabled="!controlReady"
      data-tid="cool-down"
      @click="coolDown"
    >
      <frame-icon
        name="snow"
        small
      />
      Cool down
    </button>
    <details class="control-actions__more">
      <summary
        class="cbtn"
        aria-label="More printer actions"
      >
        More
      </summary>
      <div class="control-actions__menu">
        <button
          type="button"
          class="cbtn"
          :disabled="!controlReady || busy"
          title="M84"
          data-tid="motors-off"
          @click="motorsOff"
        >
          Motors off
        </button>
        <button
          type="button"
          class="cbtn"
          :disabled="!!restartRefusal"
          data-tid="restart-klipper"
          @click="sendTypedGcode('RESTART')"
        >
          Restart Klipper
        </button>
        <button
          type="button"
          class="cbtn"
          :disabled="!!restartRefusal"
          data-tid="restart-firmware"
          @click="sendTypedGcode('FIRMWARE_RESTART')"
        >
          Firmware restart
        </button>
        <button
          type="button"
          class="cbtn"
          :disabled="!!restartRefusal || !savePending"
          data-tid="save-config"
          @click="saveConfig"
        >
          Save config and restart{{ savePending ? '' : ' · nothing to save' }}
        </button>
      </div>
    </details>
    <p
      v-if="commandRefusal"
      class="control-actions__refusal"
      role="alert"
    >
      {{ commandRefusal }}
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'

/** Home and heat up front; idle-only actions use the shared command checks. */
@Component({})
export default class ControlActions extends Mixins(ControlMixin) {
  get savePending (): boolean { return this.$store.state.printer.printer.configfile?.save_config_pending === true }
  saveConfig () { if (this.savePending) return this.sendTypedGcode('SAVE_CONFIG') }
}
</script>

<style lang="scss" scoped>
  .control-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    kbd {
      font-size: 11px;
    }
  }
  .control-actions__more { position: relative; }
  .control-actions__menu {
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: absolute;
    z-index: 10;
    right: 0;
    top: 100%;
    width: min(290px, 85vw);
    padding: 10px;
    border: 1px solid var(--m3d-border);
    border-radius: 12px;
    background: var(--m3d-surface);
    box-shadow: 0 6px 20px rgb(0 0 0 / 20%);
  }
  .control-actions__refusal { flex-basis: 100%; margin: 0; font-size: 12px; color: var(--m3d-text-muted); }
</style>
