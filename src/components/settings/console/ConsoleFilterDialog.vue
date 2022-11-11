<template>
  <v-dialog
    v-model="open"
    :max-width="500"
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

        <v-card-actions>
          <v-spacer />
          <app-btn
            color="warning"
            text
            type="button"
            @click="open = false"
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
import { Component, Vue, Prop, VModel } from 'vue-property-decorator'
import { ConsoleFilter, ConsoleFilterType } from '@/store/console/types'

@Component({})
export default class ConsoleFilterDialog extends Vue {
  @VModel({ type: Boolean, required: true })
    open!: boolean

  @Prop({ type: Object, required: true })
  readonly filter!: ConsoleFilter

  valid = true

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
    if (this.valid) {
      this.$emit('save', this.filter)
      this.open = false
    }
  }
}
</script>
