<template>
  <v-item-group class="app-btn-group">
    <slot />
  </v-item-group>
</template>

<style lang="scss">
@import '~vuetify/src/styles/styles.sass';
.app-btn-group {
  .v-btn {
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
</style>
