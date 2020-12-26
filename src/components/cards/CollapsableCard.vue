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

      <!-- Menu Buttons, desktop + -->
      <div class="d-none d-lg-flex" v-if="!isInLayout">
        <slot name="menu"></slot>
      </div>

      <!-- Menu, mobile / tablet -->
      <v-menu
        v-if="hasMenuSlot && !hideMenu && !isInLayout"
        left>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            class="d-flex d-lg-none"
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
  @Prop({ type: String, required: true })
  title!: string

  @Prop({ type: String, required: false })
  subTitle!: string

  @Prop({ type: String })
  cardKey!: string

  @Prop({ type: Boolean, default: true })
  lazy!: boolean // use v-show or v-if

  @Prop({ type: String, required: false })
  icon!: string

  @Prop({ type: Boolean, default: false })
  loading!: boolean

  @Prop({ type: Boolean, default: false })
  draggable!: boolean

  @Prop({ type: Boolean, default: false })
  inLayout!: boolean

  @Prop({ type: Boolean, default: true })
  enabled!: boolean

  @Prop({ type: Boolean, default: true })
  collapsable!: boolean

  @Prop({ type: Boolean, default: false })
  collapsed!: boolean // Determines the default state.

  @Prop({ type: String, default: 'md' })
  rounded!: string

  @Prop({ type: [Number, String], required: false })
  height!: number | string

  @Prop({ type: Boolean, default: false })
  hideMenu!: boolean

  @Prop({ type: String })
  cardClasses!: string

  @Prop({ type: String })
  contentClasses!: string

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

  get hasDefaultSlot () {
    return !!this.$slots.default || !!this.$scopedSlots.default
  }

  get hasMenuSlot () {
    return !!this.$slots.menu || !!this.$scopedSlots.menu
  }

  get hasTitleSlot () {
    return !!this.$slots.title || !!this.$scopedSlots.title
  }

  get hasSubTitleSlot () {
    return !!this.$slots['sub-title'] || !!this.$scopedSlots['sub-title']
  }

  get hasCollapseButtonSlot () {
    return !!this.$slots['collapse-button'] || !!this.$scopedSlots['collapse-button']
  }

  // Moved to a regular function because slots are not reactive.
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
