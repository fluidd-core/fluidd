<template>
  <v-tooltip
    right
    :disabled="isMobile"
  >
    <template v-slot:activator="{ attrs, on }">
      <v-list-item
        :to="to"
        :exact="exact"
        link
        color="secondary"
        v-bind="attrs"
        v-on="on"
      >
        <v-list-item-icon>
          <v-icon>{{ icon }}</v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title><slot /></v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </template>
    <span><slot /></span>
  </v-tooltip>

  <!-- <v-tooltip right :disabled="isMobile">
    <template v-slot:activator="{ attrs, on }">
      <router-link
        :to="to"
        :exact="exact"
        custom
        v-slot="{ navigate, isActive }"
      >
        <button
          v-bind="attrs"
          v-on="on"
          v-ripple
          @click="navigate"
          :class="{ 'active': isActive }"
        >
          <v-icon>{{ icon }}</v-icon>
        </button>
      </router-link>
    </template>
    <slot></slot>
  </v-tooltip> -->
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'

import StateMixin from '@/mixins/state'

@Component({})
export default class AppNavItem extends Mixins(StateMixin) {
  @Prop({ type: String })
  title!: string

  @Prop({ type: String })
  to!: string

  @Prop({ type: Boolean, default: false })
  exact!: boolean

  @Prop({ type: String })
  icon!: string

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }
}

</script>

<style lang="scss" scoped>
  @import '~vuetify/src/styles/styles.sass';

  button {
    // font-size: 0.875rem;
    // font-family: raleway, sans-serif;
    // font-weight: 300;
    // text-decoration: none;

    height: inherit;
    padding: 16px 0px;
    width: 100%;

    overflow: hidden;
    display: inline-flex;
    flex-direction: column;
    flex: 0 1 auto;
    position: relative;
    align-items: center;
    justify-content: center;

    cursor: pointer;
    outline: 0;
    user-select: none;
    white-space: nowrap;
  }

  button:before {
    background-color: currentColor;
    border-radius: inherit;
    bottom: 0;
    color: inherit;
    content: "";
    left: 0;
    opacity: 0;
    pointer-events: none;
    position: absolute;
    right: 0;
    top: 0;
  }

  button.active:before,
  button:hover::before {
    opacity: 0.08;
  }
</style>
