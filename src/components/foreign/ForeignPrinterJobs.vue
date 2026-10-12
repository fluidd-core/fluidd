<template>
  <main
    v-if="record"
    class="foreign-page"
  >
    <h1>{{ record.name }} · Jobs</h1>
    <p v-if="!capabilities?.printFromStorage">
      Start prints from the printer's own screen.
    </p>
    <ul v-if="capabilities?.printFromStorage">
      <li
        v-for="file in files"
        :key="file.path"
      >
        {{ file.name }}
        <button
          class="cbtn cbtn--primary"
          @click="print(file.path)"
        >
          Print
        </button>
      </li>
    </ul>
    <label
      v-if="capabilities?.upload"
      class="cbtn cbtn--primary"
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
import { capabilitiesFor } from '@/services/foreign-printers/adapters'
import type { DirectKind, ForeignCapabilities, ForeignFile } from '@/services/foreign-printers/types'
import { EventBus } from '@/eventBus'

@Component
export default class ForeignPrinterJobs extends Mixins(StateMixin) {
  files: ForeignFile[] = []
  get record () { return foreignRecordForSlug(this.$route.params.printer) }
  get adapter () { return this.record ? adapterFor(this.record.id) : undefined }
  get capabilities (): ForeignCapabilities | null {
    return this.record?.via === 'direct' ? capabilitiesFor(this.record.kind as DirectKind) : null
  }

  async created () {
    await connectAll()
    this.files = await this.adapter?.listFiles?.() ?? []
  }

  print (path: string) { return this.runAction(() => this.adapter?.printFile?.(path)) }

  async upload (event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) await this.runAction(() => this.adapter?.upload?.(file, file.name, true))
  }

  private async runAction (action: () => Promise<void> | undefined) {
    try {
      const result = action()
      if (!result) throw new Error('Not connected')
      await result
    } catch (error) {
      EventBus.$emit(error instanceof Error ? error.message : 'The printer command failed.', { type: 'error' })
    }
  }
}
</script>

<style scoped>
.foreign-page { max-width: 900px; margin: auto; }
.foreign-page li { display: flex; justify-content: space-between; padding: 12px 0; }
</style>
