<template>
  <v-card
    :class="_cardClasses"
    :rounded="rounded"
    :loading="isLoading"
    :color="color"
  >
    <v-card-title
      class="collapsable-card-title card-heading"
      :class="{ 'draggable': inLayout }"
    >
      <v-row
        no-gutters
        class="flex-nowrap"
      >
        <v-col
          align-self="center"
          class="text-no-wrap"
        >
          <slot name="title">
            <v-icon left>
              {{ icon }}
            </v-icon>
            <span class="font-weight-light">{{ title }}</span>
          </slot>
        </v-col>

        <v-col
          v-if="!inLayout"
          cols="auto"
          align-self="center"
        >
          <slot name="menu" />
        </v-col>

        <v-col
          cols="auto"
          align-self="center"
        >
          <!-- Collapse Control -->
          <slot name="collapse-button">
            <app-btn-collapse
              v-if="_collapsable || inLayout"
              :collapsed.sync="isCollapsed"
              :enabled.sync="isEnabled"
              :in-layout="inLayout"
            />
          </slot>
        </v-col>
      </v-row>
    </v-card-title>

    <v-expand-transition v-if="!lazy">
      <div
        v-if="!isCollapsed && !inLayout"
        id="card-content"
        :class="_contentClasses"
        :style="_contentStyles"
        @transitionend="transitionEvent"
      >
        <v-card-subtitle
          v-if="subTitle || hasSubTitleSlot"
          class="py-2"
        >
          <slot name="sub-title">
            <span v-html="subTitle" />
          </slot>
        </v-card-subtitle>
        <v-divider v-if="subTitle || hasSubTitleSlot" />

        <!-- Primary Content slot -->
        <slot />
      </div>
    </v-expand-transition>

    <v-expand-transition v-if="lazy">
      <div
        v-show="!isCollapsed && !inLayout"
        id="card-content"
        :class="_contentClasses"
        :style="_contentStyles"
        @transitionend="transitionEvent"
      >
        <v-card-subtitle
          v-if="subTitle || hasSubTitleSlot"
          class="py-2"
        >
          <slot name="subTitle">
            <span v-html="subTitle" />
          </slot>
        </v-card-subtitle>
        <v-divider v-if="subTitle || hasSubTitleSlot" />

        <!-- Primary Content slot -->
        <slot />
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script lang="ts">
import { LayoutConfig } from '@/store/layout/types'
import { kebabCase } from 'lodash-es'
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'

@Component({})
export default class CollapsableCard extends Vue {
  /**
   * Title
   */
  @Prop({ type: String, required: true })
  public title!: string

  /**
   * Card color.
   */
  @Prop({ type: String })
  public color!: string

  /**
   * Sub title.
   */
  @Prop({ type: String, required: false })
  public subTitle!: string

  /**
   * Required to bind to a layout.
   * Used to ref specific layout items.
   * Should include a path to the layout, e.g.,
   * dashboard.toolhead-card
   * Container is irrelevant as configs can not have
   * duplicate id's across containers for any given layout.
   */
  @Prop({ type: String })
  public layoutPath!: string

  /**
   * If lazy, we use a v-show for card display.
   * If not lazy, we use a v-if - removing
   * from the DOM. A good use case for this is
   * the camera card, whereby we don't want
   * to be streaming the cam image if not
   * visible.
   */
  @Prop({ type: Boolean, default: true })
  public lazy!: boolean

  /**
   * The icon to use in the title.
   */
  @Prop({ type: String, required: false })
  public icon!: string

  /**
   * The icon color to use in the title.
   */
  @Prop({ type: String, required: false })
  public iconColor!: string

  /**
   * Loading state.
   */
  @Prop({ type: Boolean, default: false })
  public loading!: boolean

  /**
   * Enables dragging of the card. Also causes the card
   * to react to layoutMode state.
   */
  @Prop({ type: Boolean, default: false })
  public draggable!: boolean

  /**
   * Whether this card is collapsable or not.
   */
  @Prop({ type: Boolean, default: true })
  public collapsable!: boolean

  /**
   * Rounded
   */
  @Prop({ type: String, default: 'md' })
  public rounded!: string

  /**
   * Optionally set a defined height.
   */
  @Prop({ type: [Number, String], required: false })
  public height!: number | string

  /**
   * Breakpoint at which to condense the menu buttons to a hamburger.
   * xs, sm, md, lg, xl.
   */
  @Prop({ type: String, default: 'lg' })
  public menuBreakpoint!: string

  /**
   * Define any optional classes for the card itself.
   */
  @Prop({ type: String })
  public cardClasses!: string

  /**
   * Define any optional classes for the card content itself.
   */
  @Prop({ type: String })
  public contentClasses!: string

  /**
   * Base classes.
   */
  baseCardClasses = { 'collapsable-card': true }
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

  get isLoading (): boolean | string {
    return (this.loading) ? 'primary' : false
  }

  /**
   * Whether this card is in a collapsed state or not.
   * E.g., in layout mode - you may set it to collapsed.
   * If the layout isn't defined, then this should always be disabled.
   */
  get isCollapsed (): boolean {
    if (!this.collapsable) {
      return false
    }
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
