<template>
  <v-dialog
    :value="value"
    :max-width="600"
    scrollable
    @input="$emit('input', $event)"
  >
    <v-form @submit.prevent="handleSubmit()">
      <v-card>
        <v-card-title class="card-heading py-2">
          <span class="focus--text">{{ $t('app.general.title.pending_configuration_changes' ) }}</span>
        </v-card-title>

        <v-card-text>
          <v-textarea
            readonly
            auto-grow
            rows="1"
            :value="saveConfigPendingItems"
            :spellcheck="false"
            style="width: 100%; font-family: monospace; font-size: 1rem; font-weight: 100 !important;"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />

          <app-btn
            color="warning"
            text
            type="button"
            @click="$emit('input', false)"
          >
            {{ $t('app.general.btn.cancel') }}
          </app-btn>

          <app-btn
            color="primary"
            type="submit"
          >
            {{ $t('app.general.btn.save_config_and_restart') }}
          </app-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class PendingChangesDialog extends Vue {
  @Prop({ type: Boolean, required: true })
  value!: boolean

  get saveConfigPendingItems () {
    const saveConfigPendingItems = this.$store.getters['printer/getSaveConfigPendingItems']

    const lines = Object.entries<Record<string, string>>(saveConfigPendingItems).map(section => {
      const [sectionName, sectionEntries] = section

      const entryValues = Object.entries(sectionEntries).map(entry => `${entry[0]}: ${entry[1]}`)

      return `[${sectionName}]\n${entryValues.join('\n')}`
    })

    return lines.join('\n\n')
  }

  handleSubmit () {
    this.$emit('input', false)
    this.$emit('save')
  }
}
</script>
