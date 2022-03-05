<template>
  <div>
    <v-subheader id="console">
      {{ $t('app.setting.title.console') }}
    </v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4"
    >
      <app-setting :title="$tc('app.setting.label.filter', 2)">
        <app-btn
          outlined
          small
          color="primary"
          @click="handleEditFilterDialog(null)"
        >
          <v-icon
            small
            left
          >
            $plus
          </v-icon>
          {{ $t('app.setting.btn.add_filter') }}
        </app-btn>
      </app-setting>

      <v-divider />

      <template v-for="filter in filters">
        <app-setting
          :key="`filter-${filter.name}`"
          :r-cols="3"
        >
          <template v-slot:title>
            {{ filter.name }}
          </template>

          <app-btn
            @click.stop="handleEditFilterDialog(filter)"
            fab
            text
            x-small
            color=""
          >
            <v-icon color="">
              $edit
            </v-icon>
          </app-btn>

          <app-btn
            @click.stop="handleRemoveFilter(filter)"
            fab
            text
            x-small
            color=""
          >
            <v-icon color="">
              $close
            </v-icon>
          </app-btn>
        </app-setting>

        <v-divider :key="`divider-${filter.name}`" />
      </template>

      <console-filter-dialog
        v-if="dialogState.open"
        v-model="dialogState.open"
        :filter="dialogState.filter"
        :rules="dialogState.rules"
        @save="handleSaveFilter"
      />
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { ConsoleFilter, ConsoleFilterType } from '@/store/console/types'
import ConsoleFilterDialog from './ConsoleFilterDialog.vue'

@Component({
  components: {
    ConsoleFilterDialog
  }
})
export default class ConsoleSettings extends Mixins(StateMixin) {
  dialogState: any = {
    open: false,
    rules: null,
    filter: null
  }

  get filters () {
    return this.$store.getters['console/getFilters']
  }

  handleEditFilterDialog (filter: ConsoleFilter) {
    const filterCopy = filter
      ? { ...filter }
      : {
        id: '',
        enabled: true,
        name: '',
        type: ConsoleFilterType.Contains,
        value: ''
      }

    this.dialogState = {
      open: true,
      rules: {
        required: (v: string) => !!v || this.$t('app.general.simple_form.error.required'),
        uniqueName: (v: string) => !this.filters.some((c: ConsoleFilter) => c.id !== this.dialogState.filter.id && c.name.toLowerCase() === v.toLowerCase()) || this.$t('app.general.simple_form.error.exists'),
        validExpression: (v: string) => {
          try {
            if (v) {
              // eslint-disable-next-line
              new RegExp(v)
            }
            return true
          } catch (e) { }
          return this.$t('app.general.simple_form.error.invalid_expression')
        }
      },
      filter: filterCopy
    }
  }

  handleRemoveFilter (filter: ConsoleFilter) {
    this.$store.dispatch('console/onRemoveFilter', filter)
  }

  handleSaveFilter (filter: ConsoleFilter) {
    this.$store.dispatch('console/onSaveFilter', filter)
  }
}
</script>
