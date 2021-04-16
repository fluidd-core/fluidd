<template>
  <v-card
    :class="_cardClasses"
    :rounded="rounded"
    :loading="isLoading">

    <v-card-title
      class="collapsable-card-title card-heading"
      :class="{ 'draggable': inLayout }"
    >
      <slot name="title">
        <v-icon left>{{ icon }}</v-icon>
        <span class="font-weight-light">{{ title }}</span>
      </slot>
      <v-spacer />

      <!-- Menu Buttons (not condensed) -->
      <div :class="menuClasses" v-if="!inLayout && !hideMenu">
        <slot name="menu"></slot>
      </div>

      <!-- Menu, (condensed to hamburger) -->
      <v-menu
        v-if="hasMenuSlot && !inLayout && !hideMenu"
        transition="slide-x-transition"
        left
        offset-y
        :close-on-content-click="false"
      >
        <template v-slot:activator="{ on, attrs }">
          <app-btn
            :class="hamburgerMenuClasses"
            fab x-small text
            color=""
            v-bind="attrs"
            v-on="on">
            <v-icon>{{ menuIcon }}</v-icon>
          </app-btn>
        </template>
        <v-sheet elevation="0" class="pa-2">
          <!-- Menu slot -->
          <slot name="menu"></slot>
        </v-sheet>
      </v-menu>

      <!-- Collapse Control -->
      <slot name="collapse-button">
        <app-btn-collapse
          v-if="_collapsable || inLayout"
          :collapsed.sync="isCollapsed"
          :enabled.sync="isEnabled"
          :inLayout="inLayout"
        >
        </app-btn-collapse>
      </slot>
    </v-card-title>

    <v-divider></v-divider>

    <v-expand-transition v-if="!lazy">
      <div
        @transitionend="transitionEvent"
        id="card-content"
        v-if="!isCollapsed && !inLayout"
        :class="_contentClasses"
        :style="_contentStyles">
        <v-card-subtitle class="py-2" v-if="subTitle || hasSubTitleSlot">
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
        v-show="!isCollapsed && !inLayout"
        :class="_contentClasses"
        :style="_contentStyles">
        <v-card-subtitle class="py-2" v-if="subTitle || hasSubTitleSlot">
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
import { LayoutConfig } from '@/store/layout/types'
import { kebabCase } from 'lodash'
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'

@Component({})
export default class CollapsableCard extends Vue {
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
   * Required to bind to a layout.
   * Used to ref specific layout items.
   * Should include a path to the layout, e.g.,
   * dashboard.toolhead-card
   * Container is irrelevant as configs can not have
   * duplicate id's across containers for any given layout.
   */
  @Prop({ type: String })
  layoutPath!: string

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
   * The icon color to use in the title.
   */
  @Prop({ type: String, required: false })
  iconColor!: string

  /**
   * Loading state.
   */
  @Prop({ type: Boolean, default: false })
  loading!: boolean

  /**
   * Enables dragging of the card. Also causes the card
   * to react to layoutMode state.
   */
  @Prop({ type: Boolean, default: false })
  draggable!: boolean

  /**
   * Whether this card is collapsable or not.
   */
  @Prop({ type: Boolean, default: true })
  collapsable!: boolean

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

  /** The menu icon to use when menu items are collapsed  */
  @Prop({ type: String, default: '$menu' })
  menuIcon!: string

  /**
   * Forcefully hide the menu btns / hamburger.
   */
  @Prop({ type: Boolean, default: false })
  hideMenu!: boolean

  /**
   * Define any optional classes for the card itself.
   */
  @Prop({ type: String })
  cardClasses!: string

  /**
   * Define any optional classes for the card content itself.
   */
  @Prop({ type: String })
  contentClasses!: string

  /**
   * Base classes.
   */
  baseCardClasses = { 'mb-2': true, 'mb-sm-4': true, 'collapsable-card': true }
  baseContentClasses = ''

  get _cardClasses () {
    // If user defined, format to an object based on the input.
    const classes: any = {}
    if (this.cardClasses) {
      this.cardClasses.split(' ').forEach(s => {
        classes[s] = true
      })
    }
    return {
      ...classes,
      ...this.baseCardClasses,
      collapsed: this.isCollapsed
    }
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

  get _collapsable () {
    if (!this.collapsable) return false
    return (this.layout) ? this.collapsable : false
  }

  get _layoutPath () {
    if (this.layoutPath) {
      if (this.layoutPath.includes('.')) {
        const split = this.layoutPath.split('.')
        return {
          name: split[0],
          id: kebabCase(split[1])
        }
      } else {
        throw new Error('invalid layout path')
      }
    }
  }

  get layout (): LayoutConfig | undefined {
    if (this._layoutPath) {
      return this.$store.getters['layout/getConfig'](this._layoutPath.name, this._layoutPath.id)
    }
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

  get isLoading (): boolean | string {
    return (this.loading) ? 'primary' : false
  }

  /**
   * Whether this card is in a collapsed state or not.
   * E.g., in layout mode - you may set it to collapsed.
   * If the layout isn't defined, then this should always be disabled.
   */
  get isCollapsed (): boolean {
    return (this.layout) ? this.layout.collapsed : false
  }

  set isCollapsed (collapsed: boolean) {
    const value = this.layout
    if (value && this._layoutPath) {
      value.collapsed = collapsed
      this.$store.dispatch('layout/onUpdateConfig', { name: this._layoutPath.name, value })
    }
  }

  @Watch('isCollapsed')
  isCollapsedChange (val: boolean) {
    this.$emit('collapsed', val)
  }

  /**
   * Whether this card is in an enabled state or not.
   * E.g., in layout mode - you may set it to disabled
   * in order to prevent its display.
   * If the layout isn't defined, then this should always be enabled.
   */
  get isEnabled (): boolean {
    return (this.layout) ? this.layout.enabled : true
  }

  set isEnabled (enabled: boolean) {
    const value = this.layout
    if (value && this._layoutPath) {
      value.enabled = enabled
      this.$store.dispatch('layout/onUpdateConfig', { name: this._layoutPath.name, value })
    }
  }

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode && this.draggable)
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

  mounted () {
    this.$emit('collapsed', this.isCollapsed)
    if (this.hasCollapseButtonSlot) {
      // this.collapsable = false
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
