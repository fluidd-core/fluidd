<template>
  <app-dialog
    v-model="open"
    :title="$t('app.general.title.pending_configuration_changes')"
    :save-button-text="$t('app.general.btn.save_config_and_restart')"
    max-width="600"
    @save="handleSubmit"
  >
    <v-card-text>
      <v-textarea
        readonly
        auto-grow
        rows="1"
        :value="saveConfigPendingItems"
        spellcheck="false"
        style="width: 100%; font-family: monospace; font-size: 1rem; font-weight: 100 !important;"
      />
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Vue, VModel } from 'vue-property-decorator'

@Component({})
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
