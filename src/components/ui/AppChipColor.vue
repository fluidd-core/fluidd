<template>
  <v-chip
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

  @include theme(v-chip) using ($material) {
    border-color: map-deep-get($material, 'text', 'primary');
  }

  .v-chip {
    border-style: solid;
    padding: 0;
    width: 24px;
  }
</style>
