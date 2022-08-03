<template>
  <json-viewer
    :value="state"
    :expand-depth="2"
    :class="$vuetify.theme.isDark ? 'jv-dark' : ''"
    sort
  />
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import JsonViewer from 'vue-json-viewer'

@Component({
  components: { JsonViewer }
})
export default class StateExplorer extends Mixins(StateMixin) {
  get state () {
    return {
      printer: this.$store.state.printer.printer
    }
  }
}
</script>

<style lang="scss">
.jv-container.jv-dark {
  background: transparent;
  color: rgba(255, 255, 255, 0.8);

  .jv-item.jv-object { color: rgba(255, 255, 255, 0.8); }
  .jv-item.jv-array { color: rgba(255, 255, 255, 0.8); }
  .jv-key { color: rgba(255, 255, 255, 0.8); }

  .jv-ellipsis {
    color: rgba(255, 255, 255, 0.5);
    background-color: rgba(255, 255, 255, 0.2);
  }
}
</style>
