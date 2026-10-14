<template>
  <div
    class="control-actions"
    data-tid="control-actions"
  >
    <button
      type="button"
      class="cbtn"
      :disabled="!klippyReady || busy"
      data-tid="home-all"
      @click="home()"
    >
      <v-progress-circular
        v-if="homing()"
        indeterminate
        size="14"
        width="2"
      />
      <frame-icon
        v-else-if="!pro"
        name="home"
        small
      />
      Home all
      <kbd v-if="pro">G28</kbd>
    </button>
    <button
      type="button"
      class="cbtn"
      :disabled="!klippyReady"
      data-tid="cool-down"
      @click="coolDown"
    >
      <frame-icon
        v-if="!pro"
        name="snow"
        small
      />
      Cool down
    </button>
    <button
      v-if="pro"
      type="button"
      class="cbtn cbtn--ghost"
      :disabled="!klippyReady || busy"
      @click="motorsOff"
    >
      Motors off
      <kbd>M84</kbd>
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'

/** Control's page actions, beside its title: Home all and Cool down; Pro shows the G-code and Motors off. */
@Component({})
export default class ControlActions extends Mixins(ControlMixin) {}
</script>

<style lang="scss" scoped>
  .control-actions {
    display: flex;
    gap: 8px;

    kbd {
      font-size: 11px;
    }
  }
</style>
