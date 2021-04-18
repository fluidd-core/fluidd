<template>
  <v-row
    no-gutters
    v-on="$listeners"
    v-bind="$attrs"
    :class="classes"
    class="setting"
  >
    <v-col :cols="cols[0]" class="setting-title" align-self="center">
      <slot name="title">{{ title }}</slot>
      <div class="setting-sub-title grey--text" v-if="hasSubTitle">
        <slot name="sub-title">
            {{ subTitle }}
        </slot>
      </div>
    </v-col>
    <v-col :cols="cols[1]" class="setting-controls" align-self="center">
      <slot></slot>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class AppSetting extends Vue {
  @Prop({ type: String, default: '' })
  title!: string;

  @Prop({ type: String })
  subTitle!: string;

  @Prop({ type: String })
  help!: string;

  @Prop({ type: Number, default: 6 })
  rCols!: number;

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

  get classes () {
    return {
      setting__link: this.hasClick
    }
  }
}
</script>

<style lang="scss" scoped>
  .setting {
    // align-items: center;
    display: flex;
    flex: 1 1 100%;
    letter-spacing: normal;
    min-height: 48px;
    outline: none;
    padding: 0 16px;
    position: relative;
    text-decoration: none;
  }

  .setting > .col {
    padding: 12px 0;
  }

  .col.setting-title {
    // display: flex;
    // flex: 0 1 auto;
    // justify-content: space-between;
    // align-items: center;
    padding-top: 12px;
    padding-bottom: 12px;
    padding-right: 12px;
  }

  .col.setting-title > .setting-sub-title {
    font-size: 0.875rem;
  }

  .setting__link {
    cursor: pointer;
    user-select: none;
  }

  .setting__link:hover::before {
    opacity: 0.08;
  }

  .setting__link::before {
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

  .setting-controls {
    display: inline-flex;
    align-self: center;
    justify-content: flex-end;
    align-items: center;
  }

  .setting-controls .v-input {
    margin: 0 !important;
  }
</style>
