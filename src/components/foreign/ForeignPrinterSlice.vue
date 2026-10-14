<template>
  <section class="foreign-slice">
    <h1>Slice for {{ record?.name || 'this printer' }}</h1>
    <p>Use your slicer's profile for this printer and save the G-code file.</p>
    <p>Open Jobs to upload it where supported, or start the file from the printer's own storage.</p>
    <router-link
      class="cbtn cbtn--primary"
      :to="`/${$route.params.printer}/jobs`"
    >
      Open Jobs
    </router-link>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { foreignRecordForSlug } from '@/services/printer-pages'

@Component
export default class ForeignPrinterSlice extends Vue {
  get record () { return foreignRecordForSlug(this.$route.params.printer) }
}
</script>

<style scoped>
.foreign-slice { max-width: 900px; margin: auto; padding: 24px; background: var(--m3d-surface); border: 1px solid var(--m3d-border); border-radius: 18px; }
.foreign-slice p { color: var(--m3d-text-muted); }
</style>
