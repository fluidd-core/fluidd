<template>
  <div>
    <!-- Expand / Contract -->
    <app-btn
      v-if="!inLayout"
      @click="$emit('update:collapsed', !collapsed)"
      color=""
      fab small text>
      <v-icon v-if="!collapsed">$chevronUp</v-icon>
      <v-icon v-if="collapsed">$chevronDown</v-icon>
    </app-btn>

    <!-- In layout -->
    <v-layout>
      <v-checkbox
        v-if="inLayout"
        :input-value="enabled"
        @change="$emit('update:enabled', $event)"
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
export default class AppBtnCollapse extends Vue {
  @Prop({ type: Boolean, default: false })
  collapsed!: boolean

  @Prop({ type: Boolean, default: true })
  enabled!: boolean

  @Prop({ type: Boolean, default: false })
  inLayout!: boolean

  // emitChange (value: boolean) {
  //   this.$emit('input', value)
  // }
}
</script>

<style lang="scss" scoped>
  .handle {
    cursor: pointer;
  }
</style>
