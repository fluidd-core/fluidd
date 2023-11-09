<template>
  <div>
    <app-setting :title="$t('app.setting.label.title')">
      <v-text-field
        v-model="config.title"
        filled
        dense
        single-line
        hide-details="auto"
        :rules="[
          $rules.required
        ]"
      />
    </app-setting>

    <v-divider />

    <app-setting :title="$t('app.setting.label.icon')">
      <v-select
        v-model="config.icon"
        filled
        dense
        single-line
        hide-details="auto"
        :items="icons"
      >
        <template #item="{item}">
          <v-icon
            dense
            color="primary"
          >
            ${{ item.text }}
          </v-icon>
          <span class="ml-2">{{ item.text }}</span>
        </template>
        <template #selection="{item}">
          <v-icon
            color="primary"
          >
            ${{ item.text }}
          </v-icon>
          <span class="ml-2">{{ item.text }}</span>
        </template>
      </v-select>
    </app-setting>

    <v-divider />

    <app-setting :title="$t('app.setting.label.height')">
      <v-text-field
        v-model="config.height"
        filled
        dense
        single-line
        hide-details="auto"
        suffix="px"
        :rules="[
          $rules.required,
          $rules.numberGreaterThanOrEqual(1)
        ]"
      />
    </app-setting>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import type { DiagnosticsCardConfig } from '@/store/diagnostics/types'
import { Icons } from '@/globals'

@Component({})
export default class CardConfigStep extends Vue {
  @Prop({ type: Object, required: true })
  readonly config!: DiagnosticsCardConfig

  get icons () {
    const icons = Object.keys(Icons)
    return icons.sort().map(icon => ({ text: icon, value: icon }))
  }
}
</script>
