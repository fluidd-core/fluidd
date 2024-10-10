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
          <v-badge
            bordered
            color="warning"
            dot
            overlap
            :value="selectedFilterTypes.length > 0"
            :offset-y="15"
            :offset-x="15"
          >
            <v-btn
              :disabled="disabled"
              fab
              small
              text
              v-bind="attrs"
              v-on="{... menu, ...tooltip}"
            >
              <v-icon>
                $filter
              </v-icon>
            </v-btn>
          </v-badge>
        </template>
        <span>{{ $t('app.general.btn.filter') }}</span>
      </v-tooltip>
    </template>

    <v-list dense>
      <v-list-item-group
        v-model="selectedFilterTypes"
        multiple
      >
        <v-list-item
          v-for="filter in filters"
          :key="`filter-${filter.type}`"
          :value="filter.type"
        >
          <template #default="{ active }">
            <v-list-item-action class="my-0">
              <v-checkbox :input-value="active" />
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>
                {{ filter.text }}
              </v-list-item-title>
              <v-list-item-subtitle v-if="filter.desc !== undefined">
                {{ filter.desc }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </template>
        </v-list-item>
      </v-list-item-group>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import type { FileFilterType, RootProperties } from '@/store/files/types'
import { Component, Vue, Prop } from 'vue-property-decorator'

type FileFilter = {
  type: FileFilterType,
  text: string,
  desc?: string,
}

@Component({})
export default class FileSystemFilterMenu extends Vue {
  @Prop({ type: String, required: true })
  readonly root!: string

  @Prop({ type: Boolean })
  readonly disabled?: boolean

  get rootProperties (): RootProperties {
    return this.$store.getters['files/getRootProperties'](this.root) as RootProperties
  }

  get filters () {
    const filters: FileFilter[] = []

    const rootFilterTypes = this.rootProperties.filterTypes

    if (rootFilterTypes.includes('print_start_time') && this.supportsHistoryComponent) {
      filters.push({
        type: 'print_start_time',
        text: this.$tc('app.file_system.filters.label.print_start_time')
      })
    }

    if (rootFilterTypes.includes('hidden_files')) {
      filters.push({
        type: 'hidden_files',
        text: this.$tc('app.file_system.filters.label.hidden_files_folders')
      })
    }

    if (rootFilterTypes.includes('klipper_backup_files')) {
      filters.push({
        type: 'klipper_backup_files',
        text: this.$tc('app.file_system.filters.label.klipper_backup_files')
      })
    }

    if (rootFilterTypes.includes('moonraker_backup_files')) {
      filters.push({
        type: 'moonraker_backup_files',
        text: this.$tc('app.file_system.filters.label.moonraker_backup_files')
      })
    }

    if (rootFilterTypes.includes('moonraker_temporary_upload_files')) {
      filters.push({
        type: 'moonraker_temporary_upload_files',
        text: this.$tc('app.file_system.filters.label.moonraker_temporary_upload_files')
      })
    }

    if (rootFilterTypes.includes('rolled_log_files')) {
      filters.push({
        type: 'rolled_log_files',
        text: this.$tc('app.file_system.filters.label.rolled_log_files')
      })
    }

    if (rootFilterTypes.includes('crowsnest_backup_files')) {
      filters.push({
        type: 'crowsnest_backup_files',
        text: this.$tc('app.file_system.filters.label.crowsnest_backup_files')
      })
    }

    return filters
  }

  get selectedFilterTypes (): FileFilterType[] {
    const selectedFilters = this.$store.state.config.uiSettings.fileSystem.activeFilters[this.root] as FileFilterType[] ?? []
    const filters = new Set(this.filters
      .map(filter => filter.type))

    return selectedFilters
      .filter(selectedFilter => filters.has(selectedFilter))
  }

  set selectedFilterTypes (value: FileFilterType[]) {
    this.$emit('change', value)
  }

  get supportsHistoryComponent () {
    return this.$store.getters['server/componentSupport']('history')
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
