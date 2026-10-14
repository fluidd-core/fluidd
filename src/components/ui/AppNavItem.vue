<template>
  <v-tooltip
    right
    :disabled="!rail"
    open-delay="150"
  >
    <template #activator="{ attrs, on }">
      <v-list-item
        :to="target"
        :exact="exact"
        link
        class="muon-nav-item"
        active-class="muon-nav-item--active"
        :ripple="false"
        v-bind="attrs"
        v-on="on"
      >
        <v-list-item-icon>
          <v-icon>{{ icon }}</v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title><slot /></v-list-item-title>
        </v-list-item-content>

        <kbd
          v-if="accelerator && enableKeyboardShortcuts"
          class="muon-nav-item__kbd"
        >{{ accelerator }}</kbd>
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
import { Component, Inject, Mixins, Prop } from 'vue-property-decorator'

import StateMixin from '@/mixins/state'
import BrowserMixin from '@/mixins/browser'
import { eventTargetIsContentEditable, keyboardEventToKeyboardShortcut } from '@/util/event-helpers'
import { Globals } from '@/globals'
import isKeyOf from '@/util/is-key-of'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'

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

  // Provided by AppNavDrawer; true while the drawer is an icon-only rail.
  @Inject({ from: 'isNavRail', default: () => () => false })
  readonly isNavRail!: () => boolean

  get rail (): boolean {
    return this.isNavRail()
  }

  /** The link for the printer Fluidd is on: Home is its own page, Jobs its Jobs. */
  get target (): string {
    return scopedPath(this.to, activeSlug())
  }

  get accelerator (): string | undefined {
    if (this.to) {
      const destination = this.to === '/'
        ? 'home'
        : this.to.substring(1)

      return isKeyOf(destination, Globals.KEYBOARD_SHORTCUTS)
        ? Globals.KEYBOARD_SHORTCUTS[destination]
        : undefined
    }
  }

  get enableKeyboardShortcuts (): boolean {
    return this.$store.state.config.uiSettings.general.enableKeyboardShortcuts
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
      this.$router.currentRoute.path !== this.target
    ) {
      event.preventDefault()

      this.$router.push(this.target)
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
  .muon-nav-item {
    min-height: 36px;
    margin: 1px 0;
    padding: 0 10px 0 12px;
    border-radius: var(--m3d-radius-sm);
    color: var(--m3d-text-muted) !important;
    font-weight: 500;

    &::before {
      opacity: 0 !important;
    }

    &:hover {
      background-color: var(--m3d-hover);
      color: var(--m3d-text) !important;
    }

    :deep(.v-list-item__icon) {
      align-self: center;
      margin: 0 12px 0 0;
      min-width: 20px;
    }

    :deep(.v-list-item__icon .v-icon) {
      color: inherit !important;
      font-size: 20px;
    }

    :deep(.v-list-item__content) {
      padding: 0;
    }

    :deep(.v-list-item__title) {
      font-size: 0.875rem;
      font-weight: inherit;
      line-height: 1.2;
    }
  }

  .muon-nav-item:hover .muon-nav-item__kbd,
  .muon-nav-item:focus-visible .muon-nav-item__kbd {
    opacity: 1;
  }

  .muon-nav-item.muon-nav-item--active,
  .muon-nav-item.v-list-item--active {
    background-color: var(--m3d-accent-soft);
    color: var(--m3d-text) !important;
    font-weight: 600;
    box-shadow: inset 2px 0 0 var(--m3d-accent);

    :deep(.v-list-item__icon .v-icon) {
      color: var(--m3d-accent) !important;
    }
  }

  .muon-nav-item__kbd {
    opacity: 0;
    transition: opacity var(--m3d-duration-fast) var(--m3d-ease);
    margin-left: 8px;
    font-size: 0.6875rem;
    color: var(--m3d-text-subtle) !important;
  }
</style>
