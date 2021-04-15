<template>
  <v-item-group class="app-btn-group">
    <slot />
  </v-item-group>
</template>

<style lang="scss">
@import '~vuetify/src/styles/styles.sass';
.app-btn-group {
  // border-radius: 2px;
  // display: inline-flex;
  // .theme--dark & {
  //   background: #424242;
  // }
  // .theme--light & {
  //   background: #fff;
  // }
  .v-btn {
    // border-radius: 0;
    // justify-content: center;
    // margin: 0;
    // min-width: auto;
    // opacity: .4;
    // padding: 0 8px;
    // width: auto;
    &:not(:last-child) {
      // border-right: 2px solid white;
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
</style>
