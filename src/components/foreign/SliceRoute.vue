<template>
  <component :is="isForeign ? 'foreign-slice' : 'slice'" />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { isForeignSlug } from '@/services/printer-pages'

@Component({
  components: {
    Slice: () => import('@/views/Slice.vue'),
    ForeignSlice: () => import('./ForeignPrinterSlice.vue')
  }
})
export default class SliceRoute extends Vue {
  get isForeign () { return isForeignSlug(this.$route.params.printer) }
}
</script>
