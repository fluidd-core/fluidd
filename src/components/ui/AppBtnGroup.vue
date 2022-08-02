<template>
  <v-item-group
    class="app-btn-group"
    :class="{
      'app-btn-group-vertical': vertical
    }"
  >
    <slot />
  </v-item-group>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class AppBtnGroup extends Vue {
  @Prop({ type: Boolean, default: false })
  public vertical!: boolean
}
</script>

<style lang="scss" scoped>
  .app-btn-group {
    display: flex;

    &:not(.app-btn-group-vertical) {
      & > :deep(.v-btn) {
        border-radius: 0;

        &:not(:last-child) {
          margin-right: 2px;
        }

        &:first-child {
          border-radius: $border-radius-root 0 0 $border-radius-root;
        }
        &:last-child {
          border-radius: 0 $border-radius-root $border-radius-root 0;
        }
      }
    }

    &.app-btn-group-vertical {
      flex-direction: column;

      & > :deep(.v-btn) {
        border-radius: 0;
        align-self: center;

        &:not(:last-child) {
          margin-bottom: 2px;
        }

        &:first-child {
          border-radius: $border-radius-root $border-radius-root 0 0;
        }
        &:last-child {
          border-radius: 0 0 $border-radius-root $border-radius-root;
        }
      }
    }
  }
</style>
