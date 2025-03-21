<template>
  <v-tooltip
    right
    :disabled="isMobileViewport"
  >
    <template #activator="{ attrs, on }">
      <v-list-item
        :to="{ name: to }"
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
    <span>
      <slot />
      <kbd
        v-if="accelerator && enableKeyboardShortcuts"
        class="ml-2"
      >{{ accelerator }}</kbd>
    </span>
  </v-tooltip>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'

import StateMixin from '@/mixins/state'
import BrowserMixin from '@/mixins/browser'
import { eventTargetIsContentEditable, keyboardEventToKeyboardShortcut } from '@/util/event-helpers'
import { Globals } from '@/globals'
import isKeyOf from '@/util/is-key-of'

@Component({})
export default class AppNavItem extends Mixins(StateMixin, BrowserMixin) {
  @Prop({ type: String })
  readonly title!: string

  @Prop({ type: String })
  readonly to!: string

  @Prop({ type: Boolean })
  readonly exact?: boolean

  @Prop({ type: String })
  readonly icon?: string

  get accelerator (): string | undefined {
    return isKeyOf(this.to, Globals.KEYBOARD_SHORTCUTS)
      ? Globals.KEYBOARD_SHORTCUTS[this.to]
      : undefined
  }

  get enableKeyboardShortcuts (): boolean {
    return this.$typedState.config.uiSettings.general.enableKeyboardShortcuts
  }

  handleKeyDown (event: KeyboardEvent) {
    if (
      !this.enableKeyboardShortcuts ||
      !this.accelerator
    ) {
      return
    }

    const shortcut = keyboardEventToKeyboardShortcut(event)

    if (
      shortcut === this.accelerator &&
      !eventTargetIsContentEditable(event) &&
      this.$route.name !== this.to
    ) {
      event.preventDefault()

      this.$router.push({ name: this.to })
    }
  }

  mounted () {
    window.addEventListener('keydown', this.handleKeyDown, false)
  }

  beforeDestroy () {
    window.removeEventListener('keydown', this.handleKeyDown)
  }
}

</script>

<style lang="scss" scoped>
  @import 'vuetify/src/styles/styles.sass';

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
