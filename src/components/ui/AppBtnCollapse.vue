<template>
  <div>
    <!-- Expand / Contract -->
    <app-btn
      v-if="!inLayout"
      color=""
      class="ml-1"
      fab
      x-small
      text
      @click="$emit('update:collapsed', !collapsed)"
    >
      <v-icon :class="{ 'rotate-180': collapsed }">
        $chevronUp
      </v-icon>
    </app-btn>

    <!-- In layout -->
    <v-layout>
      <v-checkbox
        v-if="inLayout"
        :input-value="enabled"
        hide-details
        class="mt-0 pt-0"
        @change="$emit('update:enabled', $event)"
      />
      <v-icon
        v-if="inLayout"
        class="handle"
        left
      >
        $drag
      </v-icon>
    </v-layout>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class AppBtnCollapse extends Vue {
  @Prop({ type: Boolean, default: false })
  public collapsed!: boolean

  @Prop({ type: Boolean, default: true })
  public enabled!: boolean

  @Prop({ type: Boolean, default: false })
  public inLayout!: boolean

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
