<template>
  <v-dialog
    :value="value"
    @input="$emit('input', $event)"
    :max-width="500"
  >
    <v-form
      class="mt-3"
      ref="addInstanceForm"
      v-model="valid"
      @submit.prevent="handleSave"
    >
      <v-card>
        <v-card-title class="card-heading py-2">
          <span class="focus--text">{{ filter.id ? $t('app.general.label.edit_filter') : $t('app.general.label.add_filter') }}</span>
        </v-card-title>

        <v-divider />

        <app-setting
          :title="$t('app.setting.label.enable')"
          :r-cols="8"
        >
          <v-switch
            class="mt-0"
            hide-details="auto"
            v-model="filter.enabled"
          />
        </app-setting>

        <v-divider />

        <app-setting
          :title="$t('app.general.label.name')"
          :r-cols="8"
        >
          <v-text-field
            filled
            dense
            class="mt-0"
            hide-details="auto"
            :rules="[rules.required, rules.uniqueName]"
            v-model="filter.name"
          />
        </app-setting>

        <v-divider />

        <app-setting
          :title="$t('app.setting.label.type')"
          :r-cols="8"
        >
          <v-select
            filled
            dense
            single-line
            hide-details="auto"
            :items="types"
            item-value="value"
            item-text="text"
            v-model="filter.type"
          />
        </app-setting>

        <v-divider />

        <app-setting
          :title="type.text"
          :r-cols="8"
        >
          <v-text-field
            filled
            dense
            class="mt-0"
            hide-details="auto"
            :rules="type.rules"
            v-model="filter.value"
          />
        </app-setting>

        <v-card-actions>
          <v-spacer />
          <app-btn
            color="warning"
            text
            @click="$emit('input', false)"
            type="button"
          >
            {{ $t('app.general.btn.cancel') }}
          </app-btn>
          <app-btn
            color="primary"
            type="submit"
          >
            {{ $t('app.general.btn.save') }}
          </app-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { ConsoleFilter, ConsoleFilterType } from '@/store/console/types'

@Component({})
export default class ConsoleFilterDialog extends Vue {
  @Prop({ type: Boolean, required: true })
  value!: boolean

  @Prop({ type: Object, required: true })
  rules!: any

  @Prop({ type: Object, required: true })
  filter!: ConsoleFilter

  valid = true

  types = [
    {
      text: this.$t('app.setting.label.contains'),
      value: ConsoleFilterType.Contains,
      rules: [this.rules.required]
    },
    {
      text: this.$t('app.setting.label.starts_with'),
      value: ConsoleFilterType.StartsWith,
      rules: [this.rules.required]
    },
    {
      text: this.$t('app.setting.label.expression'),
      value: ConsoleFilterType.Expression,
      rules: [this.rules.required, this.rules.validExpression]
    }
  ]

  get type () {
    return this.types.find(f => f.value === this.filter?.type) || this.types[0]
  }

  handleSave () {
    if (this.valid) {
      this.$emit('save', this.filter)
      this.$emit('input', false)
    }
  }
}
</script>
