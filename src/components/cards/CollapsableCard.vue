<template>
  <v-card
    :class="_cardClasses"
    color="tertiary"
    :rounded="rounded"
    :loading="isLoading">

    <div v-if="hasTabbedTitleSlot()" :class="{ 'draggable': isInLayout }">
      <slot
        name="tabbed-title"
        v-bind:attrs="{
          inLayout: isInLayout,
          enabled,
          value: isCollapsed,
          isCollapsed
        }"
        v-bind:on="{
          'input': onCollapseChange,
          'layout-enabled': onLayoutEnabled
        }">
      </slot>
    </div>

    <v-card-title
      v-if="!hasTabbedTitleSlot()"
      class="card-title quaternary py-1"
      :class="{ 'draggable': isInLayout }"
    >
      <slot name="title">
        <v-icon left>{{ icon }}</v-icon>
        <span class="font-weight-light">{{ title }}</span>
      </slot>
      <v-spacer />

      <!-- Menu Buttons (not condensed) -->
      <div :class="menuClasses" v-if="!isInLayout && !hideMenu">
        <slot name="menu"></slot>
      </div>

      <!-- Menu, (condensed to hamburger) -->
      <v-menu
        v-if="hasMenuSlot && !isInLayout && !hideMenu"
        left>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            :class="hamburgerMenuClasses"
            fab small text
            v-bind="attrs"
            v-on="on">
            <v-icon>$menu</v-icon>
          </v-btn>
        </template>
        <v-sheet elevation="0" class="pa-2" color="tertiary">
          <!-- Menu slot -->
          <slot name="menu"></slot>
        </v-sheet>
      </v-menu>

      <!-- Collapse Control -->
      <slot name="collapse-button">
        <btn-collapse
          :value="isCollapsed"
          @input="isCollapsed = $event"
          :enabled="enabled"
          :inLayout="isInLayout"
          @layout-enabled="$emit('enabled', $event)"
        >
        </btn-collapse>
      </slot>
    </v-card-title>

    <v-divider></v-divider>

    <v-expand-transition v-if="!lazy">
      <div
        @transitionend="transitionEvent"
        id="card-content"
        v-if="!isCollapsed && !isInLayout"
        :class="_contentClasses"
        :style="_contentStyles">
        <v-card-subtitle class="tertiary py-2" v-if="subTitle || hasSubTitleSlot">
          <slot name="sub-title">
            <span v-html="subTitle"></span>
          </slot>
        </v-card-subtitle>
        <v-divider v-if="subTitle || hasSubTitleSlot"></v-divider>

        <!-- Primary Content slot -->
        <slot></slot>
      </div>
    </v-expand-transition>

    <v-expand-transition v-if="lazy">
      <div
        @transitionend="transitionEvent"
        id="card-content"
        v-show="!isCollapsed && !isInLayout"
        :class="_contentClasses"
        :style="_contentStyles">
        <v-card-subtitle class="tertiary py-2" v-if="subTitle || hasSubTitleSlot">
          <slot name="subTitle">
            <span v-html="subTitle"></span>
          </slot>
        </v-card-subtitle>
        <v-divider v-if="subTitle || hasSubTitleSlot"></v-divider>

        <!-- Primary Content slot -->
        <slot></slot>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class ToolheadCard extends Vue {
  /**
   * Title
   */
  @Prop({ type: String, required: true })
  title!: string

  /**
   * Sub title.
   */
  @Prop({ type: String, required: false })
  subTitle!: string

  /**
   * Overrides the title being used as the card key.
   * This is primarily used as the unique key name to
   * save its state with.
   */
  @Prop({ type: String })
  cardKey!: string

  /**
   * If lazy, we use a v-show for card display.
   * If not lazy, we use a v-if - removing
   * from the DOM. A good use case for this is
   * the camera card, whereby we don't want
   * to be streaming the cam image if not
   * visible.
   */
  @Prop({ type: Boolean, default: true })
  lazy!: boolean

  /**
   * The icon to use in the title.
   */
  @Prop({ type: String, required: false })
  icon!: string

  /**
   * Loading state.
   */
  @Prop({ type: Boolean, default: false })
  loading!: boolean

  /**
   * Enables dragging of the card.
   */
  @Prop({ type: Boolean, default: false })
  draggable!: boolean

  /**
   * If in layout, only the title shows - with no menu.
   * If draggable is also true, the drag icon is shown.
   */
  @Prop({ type: Boolean, default: false })
  inLayout!: boolean

  /**
   * Whether this card is in an enabled state or not.
   * E.g., in layout mode - you may set it to disabled
   * in order to prevent its display.
   */
  @Prop({ type: Boolean, default: true })
  enabled!: boolean

  /**
   * Whether this card is collapsable or not.
   */
  @Prop({ type: Boolean, default: true })
  collapsable!: boolean

  /**
   * Whether this card is in a collapsed state or not.
   */
  @Prop({ type: Boolean, default: false })
  collapsed!: boolean // Determines the default state.

  /**
   * Rounded
   */
  @Prop({ type: String, default: 'md' })
  rounded!: string

  /**
   * Optionally set a defined height.
   */
  @Prop({ type: [Number, String], required: false })
  height!: number | string

  /**
   * Breakpoint at which to condense the menu buttons to a hamburger.
   * xs, sm, md, lg, xl.
   */
  @Prop({ type: String, default: 'lg' })
  menuBreakpoint!: string

  /**
   * Forcefully hide the menu btns / hamburger.
   */
  @Prop({ type: String, default: false })
  hideMenu!: boolean

  /**
   * Define any optional classes for the card itself.
   */
  @Prop({ type: String })
  cardClasses!: string

  /**
   * Define any option classes for the card content itself.
   */
  @Prop({ type: String })
  contentClasses!: string

  /**
   * Base classes.
   */
  baseCardClasses = 'mb-2 mb-sm-4'
  baseContentClasses = ''

  get _cardClasses () {
    return (this.cardClasses)
      ? this.cardClasses
      : this.baseCardClasses
  }

  get _contentClasses () {
    return (this.contentClasses)
      ? this.contentClasses
      : this.baseContentClasses
  }

  // height can not be applied to the card, otherwise
  // it will not collapse properly.
  // Instead we assign the height to the content area
  // and abritrarily remove what we think the header
  // height is to get close enough.
  get _contentStyles () {
    return (this.height)
      ? `height: calc(${this.height}px - 49px);`
      : ''
  }

  /**
   * The menu classes associated with the btns not inside a dropdown.
   */
  get menuClasses () {
    return `d-none d-${this.menuBreakpoint}-flex`
  }

  /**
   * The hamburger menu classes.
   */
  get hamburgerMenuClasses () {
    return `d-flex d-${this.menuBreakpoint}-none`
  }

  get id (): string {
    if (this.cardKey) return this.cardKey
    return this.title.replace(' ', '')
  }

  get isLoading (): boolean | string {
    return (this.loading) ? 'primary' : false
  }

  get isCollapsed (): boolean {
    const collapsed = (this.$store.state.config.cardState[this.id] === undefined)
      ? this.collapsed
      : this.$store.state.config.cardState[this.id]

    return collapsed
  }

  set isCollapsed (val: boolean) {
    this.$store.dispatch('config/saveCardState', { [this.id]: val })
  }

  get isInLayout (): boolean {
    return (this.inLayout && this.draggable)
  }

  /**
   * Main content.
   */
  get hasDefaultSlot () {
    return !!this.$slots.default || !!this.$scopedSlots.default
  }

  /**
   * Content for the menu. Shows in desktop +, condenses
   * to a hamburger anything below. Can be forced to a menu
   * with the forced-menu prop.
   */
  get hasMenuSlot () {
    return !!this.$slots.menu || !!this.$scopedSlots.menu
  }

  /**
   * To override the title.
   */
  get hasTitleSlot () {
    return !!this.$slots.title || !!this.$scopedSlots.title
  }

  /**
   * To override the sub title.
   */
  get hasSubTitleSlot () {
    return !!this.$slots['sub-title'] || !!this.$scopedSlots['sub-title']
  }

  /**
   * To override the collapse button.
   */
  get hasCollapseButtonSlot () {
    return !!this.$slots['collapse-button'] || !!this.$scopedSlots['collapse-button']
  }

  /**
   * To overide the title with tabs.
   * Note, this is not a computed prop because
   * slots are not reactive.
   */
  hasTabbedTitleSlot () {
    return !!this.$slots['tabbed-title'] || !!this.$scopedSlots['tabbed-title']
  }

  mounted () {
    if (this.hasCollapseButtonSlot) {
      this.collapsable = false
    }
  }

  onCollapseChange (e: boolean) {
    this.isCollapsed = e
  }

  onLayoutEnabled (e: Event) {
    this.$emit('enabled', e)
  }

  transitionEvent (e: TransitionEvent) {
    if (
      e.target &&
      e.target) {
      const target = e.target as Element
      if (target.id === 'card-content') {
        this.$emit('transition-end')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .card-title {
    min-height: 48px;
  }
</style>
