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
        <template v-for="(filter, i) in filters">
          <v-list-item
            v-if="filter.enabled"
            :key="`filter-${i}`"
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
        </template>
      </v-list-item-group>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { FileFilterType, FileRoot } from '@/store/files/types'
import { Component, Vue, Prop } from 'vue-property-decorator'

type FileFilterEntry = {
  enabled: boolean,
  text: string,
  desc?: string,
}

type FileFilter = FileFilterEntry & {
  type: FileFilterType,
}

@Component({})
export default class FileSystemFilterMenu extends Vue {
  @Prop({ type: String, required: true })
  readonly root!: FileRoot

  @Prop({ type: Boolean, default: false })
  readonly disabled!: boolean

  availableFilters: Record<FileFilterType, FileFilterEntry> = {
    print_start_time: {
      enabled: this.supportsHistoryComponent,
      text: this.$tc('app.file_system.filters.label.print_start_time'),
      desc: this.$tc('app.file_system.filters.label.print_start_time_desc')
    },
    hidden_files: {
      enabled: true,
      text: this.$tc('app.file_system.filters.label.hidden_files')
    },
    klipper_backup_files: {
      enabled: true,
      text: this.$tc('app.file_system.filters.label.klipper_backup_files')
    }
  }

  get rootFilterTypes (): FileFilterType[] {
    return this.$store.getters['files/getRootProperties'](this.root).filterTypes
  }

  get filters (): FileFilter[] {
    return this.rootFilterTypes
      .map((type): FileFilter => ({
        ...this.availableFilters[type],
        type
      }))
  }

  get selectedFilterTypes (): FileFilterType[] {
    return this.$store.state.config.uiSettings.fileSystem.activeFilters[this.root] ?? []
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
