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
      @click="collapsedModel = !collapsedModel"
    >
      <v-icon :class="{ 'rotate-180': collapsedModel }">
        $chevronUp
      </v-icon>
    </app-btn>

    <!-- In layout -->
    <v-layout>
      <v-checkbox
        v-if="inLayout"
        v-model="enabledModel"
        hide-details
        class="mt-0 pt-0"
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
import { Component, Vue, Prop, PropSync } from 'vue-property-decorator'

@Component({})
export default class AppBtnCollapse extends Vue {
  @PropSync('collapsed', { type: Boolean })
  collapsedModel?: boolean

  @PropSync('enabled', { type: Boolean, default: true })
  enabledModel?: boolean

  @Prop({ type: Boolean })
  readonly inLayout?: boolean
}
</script>

<style lang="scss" scoped>
  .handle {
    cursor: pointer;
  }
</style>
