<template>
  <v-select
    v-model="inputValue"
    :items="items"
    dense
    hide-details
    outlined
    class="gcode-preview-select"
  />
</template>

<script lang="ts">
import { Component, Prop, Vue, VModel } from 'vue-property-decorator'

@Component({})
export default class GcodePreviewSelect extends Vue {
  @VModel({ type: String })
  inputValue?: string

  @Prop({ type: Array, required: true })
  readonly items!: unknown[]
}
</script>

<style lang="scss" scoped>
  .gcode-preview-select {
    margin-top: 0;
    padding-top: 0;
  }
</style>
