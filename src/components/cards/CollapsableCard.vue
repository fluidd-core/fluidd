<template>
  <v-card
    :class="_cardClasses"
    color="tertiary"
    :rounded="rounded"
    :loading="isLoading"
    :height="height">
    <v-card-title class="card-title quaternary py-1">
      <slot name="title">
        <v-icon left>{{ icon }}</v-icon>
        <span class="font-weight-light">{{ title }}</span>
      </slot>
      <v-spacer />

      <!-- Menu Buttons, desktop + -->
      <div class="d-none d-lg-flex">
        <slot name="menu"></slot>
      </div>

      <!-- Menu, mobile / tablet -->
      <v-menu
        v-if="hasMenuSlot && !hideMenu"
        left>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            class="d-flex d-lg-none"
            fab small text
            v-bind="attrs"
            v-on="on"
          >
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
        <v-btn
          v-if="collapsable"
          @click="isCollapsed = !isCollapsed"
          fab small text>
          <v-icon v-if="!isCollapsed">$chevronUp</v-icon>
          <v-icon v-if="isCollapsed">$chevronDown</v-icon>
        </v-btn>
      </slot>
    </v-card-title>
    <v-divider></v-divider>

    <v-expand-transition>
      <div v-show="!isCollapsed" :class="_contentClasses">
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
  @Prop({ type: String })
  title!: string

  @Prop({ type: String, required: false })
  subTitle!: string

  @Prop({ type: String })
  cardKey!: string

  @Prop({ type: String, required: true })
  icon!: string

  @Prop({ type: Boolean, default: false })
  loading!: boolean

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

  get id (): string {
    return (this.cardKey) ? this.cardKey : this.title
  }

  get isLoading (): boolean | string {
    return (this.loading) ? 'primary' : false
  }

  get isCollapsed (): boolean {
    const collapsed = (this.$store.state.config.localConfig[this.id] === undefined)
      ? this.collapsed
      : this.$store.state.config.localConfig[this.id]

    return collapsed
  }

  set isCollapsed (val: boolean) {
    this.$store.dispatch('config/saveLocalStorage', { [this.id]: val })
  }

  get hasDefaultSlot () {
    return this.$slots.default || this.$scopedSlots.default
  }

  get hasMenuSlot () {
    return this.$slots.menu || this.$scopedSlots.menu
  }

  get hasTitleSlot () {
    return this.$slots.title || this.$scopedSlots.title
  }

  get hasSubTitleSlot () {
    return this.$slots.subTitle || this.$scopedSlots.subTitle
  }

  get hasCollapseButtonSlot () {
    return this.$slots['collapse-button'] || this.$scopedSlots['collapse-button']
  }

  mounted () {
    if (this.hasCollapseButtonSlot) {
      this.collapsable = false
    }
  }
}
</script>

<style lang="scss" scoped>
  .card-title {
    min-height: 48px;
  }
</style>
