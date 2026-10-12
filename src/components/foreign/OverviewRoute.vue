<template>
  <component :is="isForeign ? 'foreign-overview' : 'overview'" />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Overview from '@/views/Overview.vue'
import { isForeignSlug } from '@/services/printer-pages'

@Component({
  components: {
    Overview,
    ForeignOverview: () => import('./ForeignPrinterOverview.vue')
  }
})
export default class OverviewRoute extends Vue {
  get isForeign () { return isForeignSlug(this.$route.params.printer) }
}
</script>
