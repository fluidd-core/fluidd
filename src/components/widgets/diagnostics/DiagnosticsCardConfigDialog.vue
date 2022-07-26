<template>
  <v-dialog
    :value="value"
    :max-width="500"
    @input="$emit('input', $event)"
  >
    <v-form
      ref="form"
      v-model="valid"
      @submit.prevent="handleSave(card)"
    >
      <v-card>
        <v-card-title class="card-heading py-2">
          <span class="focus--text">{{ (card.id !== '') ? $t('app.general.label.edit_card') : $t('app.general.label.add_card') }}</span>
        </v-card-title>

        <v-divider />

        <app-setting :title="$t('app.setting.label.enable')">
          <v-switch
            v-model="card.enabled"
            class="mt-0"
            hide-details="auto"
          />
        </app-setting>

        <v-divider />

        <app-setting :title="$t('app.general.label.title')">
          <v-text-field
            v-model="card.title"
            filled
            dense
            class="mt-0"
            hide-details="auto"
            :rules="[rules.required]"
          />
        </app-setting>

        <v-divider />

        <app-setting :title="$t('app.general.label.height')">
          <v-text-field
            v-model="card.height"
            filled
            dense
            class="mt-0"
            hide-details="auto"
            :rules="[rules.required, rules.numAboveZero]"
          />
        </app-setting>

        <v-divider />

        <app-setting :title="$t('app.general.label.icon')">
          <v-select
            v-model="card.icon"
            filled
            dense
            single-line
            hide-details="auto"
            :items="icons"
            :prepend-inner-icon="`$${card.icon}`"
          />
        </app-setting>

        <v-divider />

        <app-setting
          :title="$t('app.setting.label.metrics')"
        >
          <app-btn
            outlined
            small
            color="primary"
            @click="handleEditMetrics"
          >
            <v-icon
              small
              left
            >
              $edit
            </v-icon>
            {{ $t('app.setting.btn.edit_metrics') }}
          </app-btn>
        </app-setting>

        <v-divider />

        <v-card-actions>
          <app-btn
            v-if="card.id !== ''"
            color="error"
            @click="handleDelete"
          >
            {{ $t('app.general.btn.remove') }}
          </app-btn>
          <v-spacer />
          <app-btn
            color="warning"
            text
            @click="$emit('input', false)"
          >
            {{ $t('app.general.btn.cancel') }}
          </app-btn>
          <app-btn
            color="primary"
            @click="handleSave"
          >
            {{ (card.id !== '') ? $t('app.general.btn.save') : $t('app.general.btn.add') }}
          </app-btn>
        </v-card-actions>
      </v-card>
    </v-form>

    <metrics-config-dialog
      v-if="dialogState.active"
      v-model="dialogState.active"
      :metrics="dialogState.metrics"
      @save="handleSaveMetrics"
    />
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { DiagnosticsCardConfig, Metric } from '@/store/diagnostics/types'
import { Icons } from '@/globals'
import AppSetting from '@/components/ui/AppSetting.vue'
import MetricsConfigDialog from '@/components/widgets/diagnostics/MetricsConfigDialog.vue'

@Component({
  components: { MetricsConfigDialog, AppSetting }
})
export default class DiagnosticsCardConfigDialog extends Vue {
  @Prop({ type: Boolean, required: true })
  public value!: boolean

  @Prop({ type: Object, required: true })
  public card!: DiagnosticsCardConfig

  valid = false
  dialogState: { active: boolean, metrics: Metric[] } = {
    active: false,
    metrics: []
  }

  rules = {
    required: (v: string) => (v !== undefined && v !== '') || this.$t('app.general.simple_form.error.required'),
    numAboveZero: (v: number) => v > 0 || this.$t('app.general.simple_form.error.min', { min: '> 0' })
  }

  get icons () {
    const icons = Object.keys(Icons)
    return icons.sort().map(icon => ({ text: icon, value: icon }))
  }

  get state () {
    return Object.keys(this.card)
  }

  handleSave () {
    if (this.valid) {
      this.$emit('save', this.card)
      this.$emit('input', false)
    }
  }

  handleDelete () {
    this.$emit('delete', this.card.id)
    this.$emit('input', false)
  }

  handleEditMetrics () {
    this.dialogState.metrics = JSON.parse(JSON.stringify(this.card.metrics))
    this.dialogState.active = true
  }

  handleSaveMetrics (metrics: Metric[]) {
    this.card.metrics = metrics
  }
}
</script>
