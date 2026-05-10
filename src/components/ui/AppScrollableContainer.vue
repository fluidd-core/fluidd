<template>
  <div
    ref="box"
    class="app-scrollable-container"
    @scroll="onScroll"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'

@Component
export default class AppScrollableContainer extends Vue {
  @Prop({ type: Boolean })
  readonly reversed?: boolean

  @Ref('box')
  readonly box!: HTMLElement

  scrollingAwayFromLatest = false

  @Watch('reversed')
  onReversed () {
    this.scrollToLatest(true)
  }

  @Watch('scrollingAwayFromLatest')
  onScrollingAwayFromLatest (value: boolean) {
    this.$emit('update:scrolling-away-from-latest', value)
  }

  mounted () {
    this.$nextTick(() => {
      this.scrollToLatest()
    })
  }

  updated () {
    this.$nextTick(() => {
      this.scrollToLatest()
    })
  }

  onScroll () {
    this.scrollingAwayFromLatest = (
      this.reversed
        ? this.getScrollTop()
        : this.getScrollBottom()
    ) > 1
  }

  scrollToLatest (force?: boolean) {
    if (
      !force &&
      this.scrollingAwayFromLatest
    ) {
      return
    }

    this.setScrollTop(
      this.reversed
        ? 0
        : this.box.scrollHeight
    )
  }

  getScrollTop () {
    return this.box.scrollTop
  }

  setScrollTop (value: number) {
    this.box.scrollTop = value
  }

  getScrollBottom () {
    const { scrollTop, scrollHeight, clientHeight } = this.box

    return scrollHeight - clientHeight - scrollTop
  }
}
</script>
<style lang="scss" scoped>
  .app-scrollable-container {
    overflow-y: auto;
    overflow-x: hidden;
  }
</style>
