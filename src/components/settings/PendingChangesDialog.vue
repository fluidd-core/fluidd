<template>
  <m3-dialog
    :value="open"
    title="Save the changes and restart Klipper?"
    max-width="560"
    data-tid="pending-changes"
    @close="open = false"
  >
    <p class="m3-dlg__text">
      Klipper writes these to printer.cfg, then restarts to use them, which takes a few seconds.
    </p>
    <pre
      v-if="saveConfigPendingItems"
      class="m3-dlg__panel pending__list"
    >{{ saveConfigPendingItems }}</pre>

    <template #actions>
      <button
        type="button"
        class="cbtn cbtn--ghost"
        data-tid="pending-changes-cancel"
        @click="open = false"
      >
        {{ $t('app.general.btn.cancel') }}
      </button>
      <button
        type="button"
        class="cbtn cbtn--primary"
        data-tid="pending-changes-save"
        @click="handleSubmit"
      >
        Save and restart
      </button>
    </template>
  </m3-dialog>
</template>

<script lang="ts">
import { Component, Vue, VModel } from 'vue-property-decorator'
import M3Dialog from '@/components/ui/M3Dialog.vue'

/** What a Save and restart writes to printer.cfg, before it does. */
@Component({ components: { M3Dialog } })
export default class PendingChangesDialog extends Vue {
  @VModel({ type: Boolean })
    open?: boolean

  get saveConfigPendingItems () {
    const saveConfigPendingItems = this.$store.getters['printer/getSaveConfigPendingItems'] as Record<string, Record<string, string>>

    const { changed, deleted } = Object.entries(saveConfigPendingItems)
      .reduce((previous, [sectionName, sectionEntries]) => {
        if (sectionEntries === null) {
          previous.deleted.push(`# [${sectionName}]`)
        } else {
          const sectionEntryNameValues = Object.entries(sectionEntries)
            .map(([entryName, entryValue]) => `${entryName}: ${entryValue}`)

          previous.changed.push(`[${sectionName}]\n${sectionEntryNameValues.join('\n')}`)
        }

        return previous
      }, { changed: [], deleted: [] } as { changed: string[], deleted: string[] })

    const lines = [...changed]

    if (deleted.length > 0) {
      lines.push(`# ${this.$t('app.general.msg.pending_configuration_sections_deleted')}\n${deleted.join('\n')}`)
    }

    return lines.join('\n\n')
  }

  handleSubmit () {
    this.open = false
    this.$emit('save')
  }
}
</script>

<style lang="scss" scoped>
  .pending__list {
    max-height: 50vh;
    margin: 0;
    overflow: auto;
    font-family: var(--m3d-font-mono);
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
  }
</style>
