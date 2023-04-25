<template>
  <app-dialog
    v-model="open"
    :title="filter.id ? $t('app.general.label.edit_filter') : $t('app.general.label.add_filter')"
    max-width="500"
    @save="handleSave"
  >
    <div class="overflow-y-auto">
      <app-setting
        :title="$t('app.setting.label.enable')"
        :r-cols="8"
      >
        <v-switch
          v-model="filter.enabled"
          class="mt-0"
          hide-details="auto"
        />
      </app-setting>

      <v-divider />

      <app-setting
        :title="$t('app.general.label.name')"
        :r-cols="8"
      >
        <v-text-field
          v-model="filter.name"
          filled
          dense
          class="mt-0"
          hide-details="auto"
          :rules="[
            $rules.required,
            customRules.uniqueName
          ]"
        />
      </app-setting>

      <v-divider />

      <app-setting
        :title="$t('app.setting.label.type')"
        :r-cols="8"
      >
        <v-select
          v-model="filter.type"
          filled
          dense
          single-line
          hide-details="auto"
          :items="types"
          item-value="value"
          item-text="text"
        />
      </app-setting>

      <v-divider />

      <app-setting
        :title="type.text"
        :r-cols="8"
      >
        <v-text-field
          v-model="filter.value"
          filled
          dense
          class="mt-0"
          hide-details="auto"
          :rules="[
            $rules.required,
            ...type.rules
          ]"
        />
      </app-setting>
    </div>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, VModel } from 'vue-property-decorator'
import { ConsoleFilter, ConsoleFilterType } from '@/store/console/types'

@Component({})
export default class ConsoleFilterDialog extends Vue {
  @VModel({ type: Boolean, required: true })
    open!: boolean

  @Prop({ type: Object, required: true })
  readonly filter!: ConsoleFilter

  get customRules () {
    return {
      uniqueName: (v: string) => !this.filters.some((c: ConsoleFilter) => c.id !== this.filter.id && c.name.toLowerCase() === v.toLowerCase()) || this.$t('app.general.simple_form.error.exists')
    }
  }

  get types () {
    return [
      {
        text: this.$t('app.setting.label.contains'),
        value: ConsoleFilterType.Contains,
        rules: []
      },
      {
        text: this.$t('app.setting.label.starts_with'),
        value: ConsoleFilterType.StartsWith,
        rules: []
      },
      {
        text: this.$t('app.setting.label.expression'),
        value: ConsoleFilterType.Expression,
        rules: [
          this.$rules.regExpPatternValid
        ]
      }
    ]
  }

  get type () {
    return this.types.find(f => f.value === this.filter?.type) || this.types[0]
  }

  get filters () {
    return this.$store.getters['console/getFilters']
  }

  handleSave () {
    this.$emit('save', this.filter)
    this.open = false
  }
}
</script>
