<template>
  <v-col
    v-bind="$attrs"
    v-on="$listeners"
  >
    <slot :narrow="narrow" />
  </v-col>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { markRaw } from 'vue'

@Component({
  inheritAttrs: false
})
export default class AppObservedColumn extends Vue {
  observer: ResizeObserver | null = null
  narrow = false

  updateNarrow (width: number) {
    this.narrow = width < 560
  }

  mounted () {
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = markRaw(new ResizeObserver(entries => {
        const lastEntry = entries[entries.length - 1]

        this.updateNarrow(lastEntry.contentRect.width)
      }))

      this.observer.observe(this.$el)
    }

    this.updateNarrow(this.$el.clientWidth)
  }

  beforeDestroy () {
    this.observer?.disconnect()
    this.observer = null
  }
}
</script>
