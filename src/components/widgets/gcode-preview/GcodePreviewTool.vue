<template>
  <div
    class="gcode-preview-tool"
    :class="{
      active: active
    }"
  >
    <span
      class="extruder-color mr-1"
      :style="{
        background: color
      }"
    />
    {{ label }}
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({})
export default class GcodePreviewTool extends Vue {
  @Prop({ type: [String, Number], required: true })
  readonly label!: string | number

  @Prop({ type: String, required: true })
  readonly color!: string

  @Prop({ type: Boolean })
  readonly active?: boolean
}
</script>

<style lang="scss" scoped>
  @import 'vuetify/src/styles/styles.sass';

  @include theme(gcode-preview-tool) using ($material) {
    .extruder-color {
      border-color: map-deep-get($material, 'text', 'primary');
    }
  }

  .gcode-preview-tool {
    display: inline-flex;
    border: 1px solid transparent;
    border-radius: 6px;
    align-items: center;
    padding: 0 4px;
    font-size: 0.8125rem;
    white-space: nowrap;

    &.active {
      border-color: map-deep-get($material-dark, 'text', 'primary');

      & .extruder-color {
        border-color: map-deep-get($material-dark, 'text', 'primary');
      }
    }

    & .extruder-color {
      width: 15px;
      height: 15px;
      border-width: 1px;
      border-style: solid;
      border-radius: 50%;
    }
  }
</style>
