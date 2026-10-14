<template>
  <component
    :is="isForeign ? 'foreign-jobs' : 'jobs'"
    :key="isForeign ? $route.params.printer : undefined"
  />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { isForeignSlug } from '@/services/printer-pages'

@Component({
  components: {
    Jobs: () => import('@/views/Jobs.vue'),
    ForeignJobs: () => import('./ForeignPrinterJobs.vue')
  }
})
export default class JobsRoute extends Vue {
  get isForeign () { return isForeignSlug(this.$route.params.printer) }
}
</script>
