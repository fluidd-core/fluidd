<template>
  <v-chip
    class="app-chip-color"
    :style="{
      background: color
    }"
    small
    v-bind="$attrs"
    v-on="$listeners"
  >
    <slot />
  </v-chip>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({
  inheritAttrs: false
})
export default class AppChipColor extends Vue {
  @Prop({ type: String, required: true })
  color!: string
}
</script>

<style lang="scss" scoped>
  @import 'vuetify/src/styles/styles.sass';

  @include theme(app-chip-color) using ($material) {
    border-color: map-deep-get($material, 'text', 'primary');
  }

  .app-chip-color {
    border-style: solid;
    padding: 0;
    width: 24px;
  }
</style>
