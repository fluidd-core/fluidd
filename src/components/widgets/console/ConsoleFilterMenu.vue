<template>
  <v-menu
    bottom
    left
    offset-y
    transition="slide-y-transition"
    :close-on-content-click="false"
  >
    <template #activator="{ on: menu, attrs }">
      <v-tooltip bottom>
        <template #activator="{ on: tooltip }">
          <app-btn
            :disabled="disabled"
            icon
            text
            v-bind="attrs"
            v-on="{... menu, ...tooltip}"
          >
            <v-icon>
              $filter
            </v-icon>
          </app-btn>
        </template>
        <span>{{ $t('app.general.btn.filter') }}</span>
      </v-tooltip>
    </template>

    <v-list dense>
      <v-list-item @click="hideTempWaits = !hideTempWaits">
        <v-list-item-action class="my-0">
          <v-checkbox :input-value="hideTempWaits" />
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title>
            {{ $t('app.console.label.hide_temp_waits') }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <template v-if="filters && filters.length">
        <v-divider />

        <v-list-item
          v-for="filter in filters"
          :key="filter.id"
          @click="handleToggleFilter(filter)"
        >
          <v-list-item-action class="my-0">
            <v-checkbox :input-value="filter.enabled" />
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>
              {{ filter.name }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </template>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import type { ConsoleFilter } from '@/store/console/types'
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class ConsoleFilterMenu extends Vue {
  @Prop({ type: Boolean })
  readonly disabled?: boolean

  get hideTempWaits (): boolean {
    return this.$typedState.config.uiSettings.general.hideTempWaits
  }

  set hideTempWaits (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.hideTempWaits',
      value,
      server: true
    })
  }

  get filters (): ConsoleFilter[] {
    return this.$typedState.console.consoleFilters
  }

  handleToggleFilter (filter: ConsoleFilter) {
    this.$typedDispatch('console/onSaveFilter', {
      ...filter,
      enabled: !filter.enabled
    })
  }
}
</script>

<style lang="scss" scoped>
:deep(.v-list-item--active::before) {
  opacity: 0;
}
:deep(.v-list-item--active:hover::before) {
  opacity: 0.08;
}
</style>
