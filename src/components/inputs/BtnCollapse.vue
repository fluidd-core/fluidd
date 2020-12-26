<template>
  <div>
    <!-- Expand / Contract -->
    <v-btn
      v-if="!inLayout"
      @click="emitChange(!value)"
      fab small text>
      <v-icon v-if="!value">$chevronUp</v-icon>
      <v-icon v-if="value">$chevronDown</v-icon>
    </v-btn>

    <!-- In layout -->
    <v-layout>
      <v-checkbox
        v-if="inLayout"
        :input-value="enabled"
        @change="$emit('layout-enabled', $event)"
        hide-details
        class="mt-0 pt-0">
      </v-checkbox>
      <v-icon class="handle" left v-if="inLayout">$drag</v-icon>
    </v-layout>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class BtnCollapse extends Vue {
  @Prop({ type: Boolean, default: false })
  value!: boolean

  @Prop({ type: Boolean, default: false })
  inLayout!: boolean

  @Prop({ type: Boolean, default: true })
  enabled!: boolean

  emitChange (value: boolean) {
    this.$emit('input', value)
  }
}
</script>

<style lang="scss" scoped>
  .handle {
    cursor: pointer;
  }
</style>
