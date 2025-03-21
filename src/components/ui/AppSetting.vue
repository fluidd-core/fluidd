<template>
  <v-row
    no-gutters
    :class="{
      'sc-link': hasClick
    }"
    class="app-setting-control"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <div
      v-if="accentColor"
      :style="{
        'background-color': accentColor
      }"
      class="sc-color"
    />

    <v-col
      cols="12"
      :sm="cols[0]"
      class="sc-label text-body-1 pr-0 pr-sm-3 pb-0 pb-sm-3"
      align-self="center"
    >
      <slot name="title">
        {{ title }}
      </slot>
      <div
        v-if="hasSubTitle"
        class="text-body-2 secondary--text"
      >
        <slot name="sub-title">
          {{ subTitle }}
        </slot>
      </div>
    </v-col>

    <v-col
      cols="12"
      :sm="cols[1]"
      class="sc-content py-3"
      align-self="center"
    >
      <slot />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({
  inheritAttrs: false
})
export default class AppSetting extends Vue {
  @Prop({ type: String, default: '' })
  readonly title!: string

  @Prop({ type: String })
  readonly subTitle!: string

  @Prop({ type: String })
  readonly help!: string

  @Prop({ type: String })
  readonly accentColor!: string

  @Prop({ type: Number, default: 6 })
  readonly rCols!: number

  get cols () {
    return [12 - this.rCols, this.rCols]
  }

  get hasClick () {
    return this.$listeners && this.$listeners.click
  }

  get hasSubTitle () {
    return (
      this.$slots['sub-title'] ||
      this.$scopedSlots['sub-title'] ||
      this.subTitle
    )
  }
}
</script>

<style lang="scss" scoped>
  .app-setting-control {
    display: flex;
    flex: 1 1 100%;
    min-height: 48px;
    outline: none;
    padding: 0 16px;
    position: relative;
    text-decoration: none;

    &.sc-link {
      cursor: pointer;
      user-select: none;
    }

    &.sc-link:hover::before {
      opacity: 0.08;
    }

    &.sc-link::before {
      background-color: currentColor;
      bottom: 0;
      content: "";
      left: 0;
      opacity: 0;
      pointer-events: none;
      position: absolute;
      right: 0;
      top: 0;
      transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
    }

    .sc-accent {
      display: block;
      position: absolute;
      left: 0;
      width: 3px;
      height: 100%;
    }

    .sc-label {
      padding: 12px 0;
    }

    .sc-content {
      display: inline-flex;
      align-self: center;
      justify-content: flex-end;
      align-items: center;
    }

    .sc-content .v-input {
      margin: 0 !important;
    }
  }
</style>
