<template>
  <div class="file-system">
    <v-toolbar
      dense
    >
      <v-spacer />

      <app-column-picker
        v-if="headers"
        key-name="history"
        :headers="configurableHeaders"
      />

      <div
        style="max-width: 160px;"
        class="ms-1 my-1"
      >
        <v-text-field
          v-model="search"
          outlined
          dense
          single-line
          hide-details
          spellcheck="false"
          append-icon="$magnify"
          @focus="$event.target.select()"
        />
      </div>
    </v-toolbar>

    <v-data-table
      :items="history"
      :headers="headers"
      :items-per-page="15"
      single-expand
      :search="search"
      mobile-breakpoint="0"
      item-key="job_id"
      sort-by="start_time"
      sort-desc
      fixed-header
    >
      <template #item="{ headers, item }">
        <app-data-table-row
          :key="item.job_id"
          :headers="headers"
          :item="item"
          :class="{
            'v-data-table__inactive': !item.exists
          }"
          :custom-getter="getItemValue"
        >
          <template #[`item.data-table-icons`]>
            <!-- If the item no longer exists. -->
            <v-icon
              v-if="!item.exists"
              class="mr-2"
              color="grey"
            >
              $fileCancel
            </v-icon>

            <!-- If the item exists, but has no thumbnail data. -->
            <v-icon
              v-else-if="!item.metadata.thumbnails?.length"
              class="mr-2"
              color="grey"
            >
              $file
            </v-icon>

            <!-- If the item exists, and we have thumbnail data. -->
            <img
              v-else
              class="mr-2 file-icon-thumb"
              :src="getThumbUrl(item.metadata, 'gcodes', getFilePaths(item.filename).path, false, item.metadata.modified)"
              :width="24"
              @error="handleJobThumbnailError(item)"
            >
          </template>

          <template #[`item.status`]>
            <job-history-item-status :job="item" />
          </template>

          <template #[`item-value.metadata.filament_colors`]="{ value }">
            <app-data-table-cell-colors :colors="value" />
          </template>

          <template #[`item-value.metadata.extruder_colors`]="{ value }">
            <app-data-table-cell-colors :colors="value" />
          </template>

          <template #[`item-value.metadata.filament_temps`]="{ value }">
            <app-data-table-cell-temps :temps="value" />
          </template>

          <template #[`item-value.metadata.first_layer_bed_temp`]="{ value }">
            {{ value }}<small>°C</small>
          </template>

          <template #[`item-value.metadata.first_layer_extr_temp`]="{ value }">
            {{ value }}<small>°C</small>
          </template>

          <template #[`item-value.metadata.chamber_temp`]="{ value }">
            {{ value }}<small>°C</small>
          </template>

          <template #[`item.actions`]>
            <app-btn
              icon
              @click="handleRemoveJob(item)"
            >
              <v-icon dense>
                $delete
              </v-icon>
            </app-btn>
          </template>
        </app-data-table-row>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import JobHistoryItemStatus from './JobHistoryItemStatus.vue'
import FilesMixin from '@/mixins/files'
import getFilePaths from '@/util/get-file-paths'
import type { HistoryItem } from '@/store/history/types'
import { SocketActions } from '@/api/socketActions'
import type { AppDataTableHeader } from '@/types'
import type { DataTableHeader } from 'vuetify'
import type { MoonrakerSensor } from '@/store/sensors/types'
import type { DefaultGetterFunction } from '@/components/ui/AppDataTableRow.vue'

@Component({
  components: {
    JobHistoryItemStatus
  }
})
export default class JobHistory extends Mixins(FilesMixin) {
  search = ''

  get auxiliaryDataHeaders (): AppDataTableHeader[] {
    const auxiliaryDataHeaders = this.history
      .reduce<Record<string, string>>((headers, item) => {
        if (item.auxiliary_data) {
          for (const auxiliaryDataItem of item.auxiliary_data) {
            headers[auxiliaryDataItem.name] = auxiliaryDataItem.description
          }
        }

        return headers
      }, {})

    for (const sensor of this.sensors) {
      if (sensor.history_fields) {
        for (const historyField of sensor.history_fields) {
          auxiliaryDataHeaders[historyField.field] = historyField.description
        }
      }
    }

    return Object.entries(auxiliaryDataHeaders)
      .map(([name, description]): AppDataTableHeader => ({
        text: this.$filters.prettyCase(description),
        value: `auxiliary_data.${name}`,
        cellClass: 'text-no-wrap'
      }))
  }

  get configurableHeaders (): AppDataTableHeader[] {
    const headers: AppDataTableHeader[] = [
      {
        text: this.$tc('app.general.table.header.status'),
        value: 'status',
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.start_time'),
        value: 'start_time',
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.end_time'),
        value: 'end_time',
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.print_duration'),
        value: 'print_duration',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.total_duration'),
        value: 'total_duration',
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.filament_used'),
        value: 'filament_used',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.user'),
        value: 'user',
        visible: false,
        cellClass: 'text-no-wrap',
      },
      {
        text: this.$tc('app.general.table.header.height'),
        value: 'metadata.object_height',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.first_layer_height'),
        value: 'metadata.first_layer_height',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.layer_height'),
        value: 'metadata.layer_height',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.filament_name'),
        value: 'metadata.filament_name',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.filament_colors'),
        value: 'metadata.filament_colors',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.extruder_colors'),
        value: 'metadata.extruder_colors',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.filament_temps'),
        value: 'metadata.filament_temps',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.filament_type'),
        value: 'metadata.filament_type',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.filament'),
        value: 'metadata.filament_total',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.filament_change_count'),
        value: 'metadata.filament_change_count',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.filament_weight_total'),
        value: 'metadata.filament_weight_total',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.filament_weights'),
        value: 'metadata.filament_weights',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.mmu_print'),
        value: 'metadata.mmu_print',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.referenced_tools'),
        value: 'metadata.referenced_tools',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.nozzle_diameter'),
        value: 'metadata.nozzle_diameter',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.slicer'),
        value: 'metadata.slicer',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.slicer_version'),
        value: 'metadata.slicer_version',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.estimated_time'),
        value: 'metadata.estimated_time',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.first_layer_bed_temp'),
        value: 'metadata.first_layer_bed_temp',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.first_layer_extr_temp'),
        value: 'metadata.first_layer_extr_temp',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.chamber_temp'),
        value: 'metadata.chamber_temp',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.file_processors'),
        value: 'metadata.file_processors',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      ...this.auxiliaryDataHeaders,
      {
        text: this.$tc('app.general.table.header.modified'),
        value: 'metadata.modified',
        cellClass: 'text-no-wrap',
        width: '1%'
      },
      {
        text: this.$tc('app.general.table.header.size'),
        value: 'metadata.size',
        cellClass: 'text-no-wrap',
        width: '1%'
      },
    ]

    const mergedTableHeaders: AppDataTableHeader[] = this.$typedGetters['config/getMergedTableHeaders'](headers, 'history')

    return mergedTableHeaders
  }

  get headers (): DataTableHeader[] {
    return [
      {
        text: '',
        value: 'data-table-icons',
        sortable: false,
        width: '24px'
      },
      {
        text: this.$tc('app.general.table.header.name'),
        value: 'filename'
      },
      ...this.configurableHeaders
        .filter(header => header.visible !== false),
      {
        text: this.$tc('app.general.table.header.actions'),
        value: 'actions',
        sortable: false,
        align: 'end'
      }
    ]
  }

  get sensors (): MoonrakerSensor[] {
    return this.$typedGetters['sensors/getSensors']
  }

  get history (): HistoryItem[] {
    return this.$typedGetters['history/getHistory']
  }

  getFilePaths (filename: string) {
    return getFilePaths(filename, 'gcodes')
  }

  async handleRemoveJob (job: HistoryItem) {
    const result = await this.$confirm(
      this.$tc('app.general.simple_form.msg.confirm_delete', 1),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (result) {
      SocketActions.serverHistoryDeleteJob(job.job_id)
    }
  }

  handleJobThumbnailError (job: HistoryItem) {
    this.$typedDispatch('history/clearHistoryThumbnails', job.job_id)
  }

  getItemValue (item: HistoryItem, header: DataTableHeader, defaultGetter: DefaultGetterFunction) {
    if (header.value.startsWith('auxiliary_data.')) {
      const auxiliaryDataItemName = header.value.substring(15)

      const { value, units } = item.auxiliary_data?.find(x => x.name === auxiliaryDataItemName) ?? {}

      if (
        Array.isArray(value) &&
        value.length > 0
      ) {
        return value
          .map(x => this.formatValueWithUnits(x, units))
      }

      return this.formatValueWithUnits(value, units)
    }

    const value = defaultGetter(item, header)

    if (typeof value === 'number') {
      switch (header.value) {
        case 'start_time':
        case 'end_time':
        case 'metadata.modified': {
          return this.$filters.formatDateTime(value * 1000)
        }

        case 'metadata.size':
          return this.$filters.getReadableFileSizeString(value)

        case 'print_duration':
        case 'total_duration':
        case 'metadata.estimated_time':
          return this.$filters.formatCounterSeconds(value)

        case 'filament_used':
        case 'metadata.filament_total':
        case 'metadata.object_height':
          return this.$filters.getReadableLengthString(value)

        case 'metadata.filament_weight_total':
          return this.$filters.getReadableWeightString(value)

        case 'metadata.first_layer_height':
        case 'metadata.layer_height':
        case 'metadata.nozzle_diameter':
          return `${value} mm`
      }
    }

    if (Array.isArray(value) && value.length > 0) {
      switch (header.value) {
        case 'metadata.filament_weights':
          return value
            .map(x => typeof x === 'number'
              ? this.$filters.getReadableWeightString(x)
              : x
            )

        case 'metadata.file_processors':
        case 'metadata.referenced_tools':
          return value
            .map(x => typeof x === 'string'
              ? this.$filters.prettyCase(x)
              : x
            )
      }
    }

    return value
  }

  formatValueWithUnits (value: unknown, units?: string | null) {
    if (typeof value === 'number') {
      const roundedValue = Math.round(value * 100) / 100

      return units
        ? `${roundedValue} ${units}`
        : roundedValue.toString()
    }

    if (typeof value === 'string' && units) {
      return `${value} ${units}`
    }

    return value
  }
}
</script>
