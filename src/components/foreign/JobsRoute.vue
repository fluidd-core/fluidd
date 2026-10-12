<template>
  <component :is="isForeign ? 'foreign-jobs' : 'jobs'" />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Jobs from '@/views/Jobs.vue'
import { isForeignSlug } from '@/services/printer-pages'

@Component({
  components: {
    Jobs,
    ForeignJobs: () => import('./ForeignPrinterJobs.vue')
  }
})
export default class JobsRoute extends Vue {
  get isForeign () { return isForeignSlug(this.$route.params.printer) }
}
</script>
