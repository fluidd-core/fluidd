<template>
  <component
    :is="isForeign ? 'foreign-overview' : 'overview'"
    :key="isForeign ? $route.params.printer : undefined"
  />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { isForeignSlug } from '@/services/printer-pages'

@Component({
  components: {
    Overview: () => import('@/views/Overview.vue'),
    ForeignOverview: () => import('./ForeignPrinterOverview.vue')
  }
})
export default class OverviewRoute extends Vue {
  get isForeign () { return isForeignSlug(this.$route.params.printer) }
}
</script>
