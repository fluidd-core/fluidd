<template>
  <div class="status-label d-flex align-baseline">
    <div
      class="status-label__label body-2 secondary--text"
      :style="{
        flex: `0 0 ${$filters.getPixelsString(labelWidth)}`
      }"
    >
      <slot name="label">
        <span class="text-pre-wrap">{{ label }}</span>
      </slot>
    </div>
    <span class="status-label__value"><slot>--</slot></span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({})
export default class StatusLabel extends Vue {
  @Prop({ type: String })
  readonly label?: string

  @Prop({ type: [String, Number], default: 80 })
  readonly labelWidth!: string | number
}
</script>

<style lang="scss" scoped>
  .status-label {
    margin: 0 0 2px 0;
  }

  .status-label__value {
    flex: 1 1 auto;
    min-width: 0;
  }
</style>
