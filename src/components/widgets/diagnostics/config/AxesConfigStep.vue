<template>
  <v-row>
    <template
      v-for="(n, i) in 2"
    >
      <v-col
        :key="`${i}-col`"
        cols="12"
        md="6"
      >
        <app-setting :title="$t('app.setting.label.enable')">
          <v-switch
            v-model="config.axes[i].enabled"
            hide-details
          />
        </app-setting>

        <v-divider />

        <app-setting :title="$t('app.setting.label.show_legend')">
          <v-switch
            v-model="config.axes[i].showLegend"
            hide-details
          />
        </app-setting>

        <v-divider />

        <app-setting :title="$t('app.setting.label.unit')">
          <v-text-field
            v-model="config.axes[i].unit"
            filled
            dense
            single-line
            hide-details="auto"
            :rules="[rules.required]"
          />
        </app-setting>

        <v-divider />

        <app-setting :title="$t('app.setting.label.min')">
          <v-text-field
            v-model="config.axes[i].min"
            filled
            dense
            single-line
            hide-details="auto"
            :hint="$t('app.settings.label.optional')"
            :rules="[rules.validNum]"
          />
        </app-setting>

        <v-divider />

        <app-setting :title="$t('app.setting.label.max')">
          <v-text-field
            v-model="config.axes[i].max"
            filled
            dense
            single-line
            hide-details="auto"
            :hint="$t('app.settings.label.optional')"
            :rules="[rules.validNum]"
          />
        </app-setting>
      </v-col>

      <v-divider
        v-if="i === 0"
        :key="`${i}-seperator`"
        vertical
      />
    </template>
  </v-row>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { DiagnosticsCardConfig } from '@/store/diagnostics/types'
import AppSetting from '@/components/ui/AppSetting.vue'

@Component({
  components: { AppSetting }
})
export default class AxesConfigStep extends Vue {
  @Prop({ type: Object, required: true })
  public config!: DiagnosticsCardConfig

  rules = {
    required: (v: string) => (v !== undefined && v !== '') || this.$t('app.general.simple_form.error.required'),
    validNum: (v: string) => ([undefined, ''].includes(v) || !isNaN(+v)) || this.$t('app.general.simple_form.error.invalid_number')
  }
}
</script>
