<template>
  <router-link
    :to="to"
    :exact="exact"
    custom
    v-slot="{ navigate, isActive }"
  >
    <button v-ripple @click="navigate" :class="{ 'active': isActive }">
      <v-icon>{{ icon }}</v-icon>
      <span>
        <slot></slot>
      </span>
    </button>
  </router-link>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'

import StateMixin from '@/mixins/state'

@Component({})
export default class AppNavItem extends Mixins(StateMixin) {
  @Prop({ type: String })
  to!: string

  @Prop({ type: Boolean, default: false })
  exact!: boolean

  @Prop({ type: String })
  icon!: string
}

</script>

<style lang="scss" scoped>
  @import '~vuetify/src/styles/styles.sass';

  button {
    font-size: 0.875rem;
    font-family: raleway, sans-serif;
    font-weight: 300;
    text-decoration: none;

    height: inherit;
    padding: 1px 12px;
    min-width: 80px;

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
