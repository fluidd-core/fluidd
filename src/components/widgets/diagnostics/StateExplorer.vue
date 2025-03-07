<template>
  <json-viewer
    :value="state"
    :expand-depth="2"
    :class="$vuetify.theme.dark ? 'jv-dark' : ''"
    sort
    @keyclick="handleClick"
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

  /*
   * the path vue-json-viewer puts out is completely butchered,
   * we try our best to fix them.
   * e.g. ("printer.tmc2209 extruder" -> "printer['tmc2209 extruder']")
   */
  handleClick (path: string) {
    const sanitizedPath = path
      .replace('$.', '')
      .replace(/\.(\w*\s+\w*)/g, (_, match) => {
        if (isNaN(match)) return `['${match}']`
        return `[${match}]`
      })

    this.$emit('input', sanitizedPath)
  }
}
</script>

<style lang="scss">
.jv-container>.jv-code {
  padding: 0 !important;
}

.jv-container.jv-dark {
  background: transparent !important;
  color: rgba(255, 255, 255, 0.8) !important;

  .jv-item.jv-object { color: rgba(255, 255, 255, 0.8) !important; }
  .jv-item.jv-array { color: rgba(255, 255, 255, 0.8) !important; }
  .jv-key { color: rgba(255, 255, 255, 0.8) !important; }

  .jv-ellipsis {
    color: rgba(255, 255, 255, 0.5) !important;
    background-color: rgba(255, 255, 255, 0.2) !important;
  }
}
</style>
