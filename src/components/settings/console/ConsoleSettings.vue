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

      <template v-for="filter in filters">
        <v-divider :key="`divider-${filter.name}`" />

        <app-setting
          :key="`filter-${filter.name}`"
          :r-cols="3"
        >
          <template #title>
            {{ filter.name }}
          </template>

          <app-btn
            fab
            text
            x-small
            color=""
            class="ms-1"
            @click.stop="handleEditFilterDialog(filter)"
          >
            <v-icon color="">
              $edit
            </v-icon>
          </app-btn>

          <app-btn
            fab
            text
            x-small
            color=""
            class="ms-1"
            @click.stop="handleRemoveFilter(filter)"
          >
            <v-icon color="">
              $delete
            </v-icon>
          </app-btn>
        </app-setting>
      </template>

      <console-filter-dialog
        v-if="dialogState.open"
        v-model="dialogState.open"
        :filter="dialogState.filter"
        @save="handleSaveFilter"
      />
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { ConsoleFilter } from '@/store/console/types'
import ConsoleFilterDialog from './ConsoleFilterDialog.vue'

@Component({
  components: {
    ConsoleFilterDialog
  }
})
export default class ConsoleSettings extends Mixins(StateMixin) {
  dialogState: any = {
    open: false,
    filter: null
  }

  get filters () {
    return this.$store.getters['console/getFilters']
  }

  handleEditFilterDialog (filter: ConsoleFilter | null) {
    const filterCopy: ConsoleFilter = filter
      ? { ...filter }
      : {
          id: '',
          enabled: true,
          name: '',
          type: 'contains',
          value: ''
        }

    this.dialogState = {
      open: true,
      filter: filterCopy
    }
  }

  async handleRemoveFilter (filter: ConsoleFilter) {
    const result = await this.$confirm(
      this.$t('app.general.simple_form.msg.confirm_remove_console_filter', { name: filter.name }).toString(),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (result) {
      this.$store.dispatch('console/onRemoveFilter', filter)
    }
  }

  handleSaveFilter (filter: ConsoleFilter) {
    this.$store.dispatch('console/onSaveFilter', filter)
  }
}
</script>
