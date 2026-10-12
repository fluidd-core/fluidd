<template>
  <main
    v-if="record"
    class="foreign-page"
  >
    <h1>{{ record.name }} · Jobs</h1>
    <p v-if="!adapter?.capabilities.printFromStorage">
      Start prints from the printer's own screen.
    </p>
    <ul v-else>
      <li
        v-for="file in files"
        :key="file.path"
      >
        {{ file.name }}
        <button
          class="btn"
          @click="print(file.path)"
        >
          Print
        </button>
      </li>
    </ul>
    <label
      v-if="adapter?.capabilities.upload"
      class="btn"
    >
      Upload and print
      <input
        type="file"
        accept=".gcode,.gco,.g"
        hidden
        @change="upload"
      >
    </label>
  </main>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { foreignRecordForSlug } from '@/services/printer-pages'
import { adapterFor, connectAll } from '@/services/foreign-printers/live'
import type { ForeignFile } from '@/services/foreign-printers/types'

@Component
export default class ForeignPrinterJobs extends Mixins(StateMixin) {
  files: ForeignFile[] = []
  get record () { return foreignRecordForSlug(this.$route.params.printer) }
  get adapter () { return this.record ? adapterFor(this.record.id) : undefined }

  async created () {
    await connectAll()
    this.files = await this.adapter?.listFiles?.() ?? []
  }

  print (path: string) { return this.adapter?.printFile?.(path) }

  async upload (event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) await this.adapter?.upload?.(file, file.name, true)
  }
}
</script>

<style scoped>
.foreign-page { max-width: 900px; margin: auto; }
.foreign-page li { display: flex; justify-content: space-between; padding: 12px 0; }
</style>
