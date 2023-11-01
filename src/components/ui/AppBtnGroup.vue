<template>
  <v-item-group
    class="app-btn-group"
    :class="{
      'app-btn-group--vertical': vertical,
      'app-btn-group--divided': divided,
      [`elevation-${elevation ?? 2}`]: divided || elevation
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
  readonly vertical!: boolean

  @Prop({ type: Boolean, default: false })
  readonly divided!: boolean

  @Prop({ type: Number, required: false })
  readonly elevation?: boolean
}
</script>

<style lang="scss" scoped>
  @import 'vuetify/src/styles/styles.sass';

  @include theme(app-btn-group) using ($material) {
    &.app-btn-group--divided > :deep(.v-btn) {
      border-color: map-get($material, 'dividers') !important;
    }
  }

  .app-btn-group {
    display: inline-flex;
    vertical-align: middle;
    white-space: nowrap;
    border-radius: $border-radius-root;

    &.app-btn-group--divided {
      & > :deep(.v-btn) {
        box-shadow: none;
      }
    }

    &:not(.app-btn-group--vertical) {
      & > :deep(.v-btn) {
        border-radius: 0;

        &:first-child {
          border-top-left-radius: $border-radius-root;
          border-bottom-left-radius: $border-radius-root;
        }
        &:last-child {
          border-top-right-radius: $border-radius-root;
          border-bottom-right-radius: $border-radius-root;
        }
      }

      &.app-btn-group--divided > :deep(.v-btn):not(:last-child) {
        border-right-width: thin;
        border-right-style: solid;
      }

      &:not(.app-btn-group--divided) > :deep(.v-btn):not(:last-child) {
        margin-right: 2px;
      }
    }

    &.app-btn-group--vertical {
      flex-direction: column;

      & > :deep(.v-btn) {
        border-radius: 0;
        align-self: center;

        &:first-child {
          border-top-left-radius: $border-radius-root;
          border-top-right-radius: $border-radius-root;
        }
        &:last-child {
          border-bottom-left-radius: $border-radius-root;
          border-bottom-right-radius: $border-radius-root;
        }

      &.app-btn-group--divided > :deep(.v-btn):not(:last-child) {
        border-bottom-width: thin;
        border-bottom-style: solid;
      }}

      &:not(.app-btn-group--divided) > :deep(.v-btn):not(:last-child) {
        margin-bottom: 2px;
      }
    }
  }
</style>
