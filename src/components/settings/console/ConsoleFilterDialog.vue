<template>
  <v-dialog
    :value="value"
    :max-width="500"
    @input="$emit('input', $event)"
  >
    <v-form
      ref="addInstanceForm"
      v-model="valid"
      class="mt-3"
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
            :rules="[rules.required, rules.uniqueName]"
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
            :rules="type.rules"
          />
        </app-setting>

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
  readonly value!: boolean

  @Prop({ type: Object, required: true })
  readonly rules!: any

  @Prop({ type: Object, required: true })
  readonly filter!: ConsoleFilter

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
