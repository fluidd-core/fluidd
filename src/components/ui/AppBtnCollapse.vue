<template>
  <div>
    <!-- Expand / Contract -->
    <app-btn
      v-if="!inLayout"
      icon
      @click="collapsedModel = !collapsedModel"
    >
      <v-icon
        dense
        :class="{ 'rotate-180': collapsedModel }"
      >
        $chevronUp
      </v-icon>
    </app-btn>

    <!-- In layout -->
    <v-layout v-if="inLayout">
      <v-checkbox
        v-model="enabledModel"
        hide-details
        class="mt-0 pt-0"
      />
      <app-drag-icon class="ms-1" />
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
