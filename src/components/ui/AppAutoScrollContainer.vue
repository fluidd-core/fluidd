<template>
  <div
    ref="box"
    class="app-auto-scroll-container"
    @scroll="updateAutoScrollPaused"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import { markRaw } from 'vue'

@Component
export default class AppAutoScrollContainer extends Vue {
  @Prop({ type: Boolean })
  readonly reversed?: boolean

  @Ref('box')
  readonly box!: HTMLElement

  autoScrollPaused = false
  resizeObserver: ResizeObserver | null = null

  @Watch('reversed')
  onReversed () {
    this.scrollToLatest(true)
  }

  @Watch('autoScrollPaused')
  onAutoScrollPaused (value: boolean) {
    this.$emit('update:auto-scroll-paused', value)
  }

  mounted () {
    this.scrollToLatest()
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = markRaw(new ResizeObserver(() => this.updateAutoScrollPaused()))
      this.resizeObserver.observe(this.box)
    }
  }

  updated () {
    this.scrollToLatest()
  }

  beforeDestroy () {
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
  }

  private updateAutoScrollPaused () {
    this.autoScrollPaused = (
      this.reversed
        ? this.getScrollTop()
        : this.getScrollBottom()
    ) > 1
  }

  scrollToLatest (force?: boolean) {
    if (
      !force &&
      this.autoScrollPaused
    ) {
      return
    }

    this.$nextTick(() => {
      this.setScrollTop(
        this.reversed
          ? 0
          : this.box.scrollHeight
      )
      this.autoScrollPaused = false
    })
  }

  private getScrollTop () {
    return this.box.scrollTop
  }

  private setScrollTop (value: number) {
    this.box.scrollTop = value
  }

  private getScrollBottom () {
    const { scrollTop, scrollHeight, clientHeight } = this.box

    return scrollHeight - clientHeight - scrollTop
  }
}
</script>
<style lang="scss" scoped>
  .app-auto-scroll-container {
    overflow-y: auto;
    overflow-x: hidden;
  }
</style>
