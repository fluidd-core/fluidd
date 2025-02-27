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
          :headers="headers"
          :item="item"
          :class="{
            'v-data-table__inactive': !item.exists
          }"
        >
          <template #[`item.data-table-icons`]>
            <!-- If the item no longer exists. -->
            <v-icon
              v-if="!item.exists"
              class="mr-2"
              color="secondary"
            >
              $fileCancel
            </v-icon>

            <!-- If the item exists, but has no thumbnail data. -->
            <v-icon
              v-else-if="!item.metadata.thumbnails?.length"
              class="mr-2"
              color="secondary"
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

          <template #[`item.filename`]="{ value }">
            {{ value }}
          </template>

          <template #[`item.status`]>
            <job-history-item-status :job="item" />
          </template>

          <template #[`item.start_time`]="{ value }">
            {{ $filters.formatDateTime(value * 1000) }}
          </template>

          <template #[`item.end_time`]="{ value }">
            {{
              item.status !== 'in_progress'
                ? $filters.formatDateTime(value * 1000)
                : '--'
            }}
          </template>

          <template #[`item.print_duration`]="{ value }">
            {{ $filters.formatCounterSeconds(value) }}
          </template>

          <template #[`item.total_duration`]="{ value }">
            {{ $filters.formatCounterSeconds(value) }}
          </template>

          <template #[`item.filament_used`]="{ value }">
            {{ $filters.getReadableLengthString(value) }}
          </template>

          <template #[`item.user`]="{ value }">
            {{ value || '--' }}
          </template>

          <template #[`item.metadata.object_height`]="{ value }">
            {{
              value != null
                ? $filters.getReadableLengthString(value)
                : '--'
            }}
          </template>

          <template #[`item.metadata.first_layer_height`]="{ value }">
            {{
              value != null
                ? `${value} mm`
                : '--'
            }}
          </template>

          <template #[`item.metadata.layer_height`]="{ value }">
            {{
              value != null
                ? `${value} mm`
                : '--'
            }}
          </template>

          <template #[`item.metadata.filament_name`]="{ value }">
            {{ value || '--' }}
          </template>

          <template #[`item.metadata.filament_colors`]="{ value }">
            <template v-if="value != null && value.length > 0">
              <app-chip-color
                v-for="(color, index) in value"
                :key="index"
                :color="color"
              />
            </template>
            <template v-else>
              --
            </template>
          </template>

          <template #[`item.metadata.extruder_colors`]="{ value }">
            <template v-if="value != null && value.length > 0">
              <app-chip-color
                v-for="(color, index) in value"
                :key="index"
                :color="color"
              />
            </template>
            <template v-else>
              --
            </template>
          </template>

          <template #[`item.metadata.filament_temps`]="{ value }">
            <template v-if="value != null && value.length > 0">
              <v-chip
                v-for="(temp, index) in value"
                :key="index"
                class="mr-1"
                small
              >
                {{ temp }}<small>°C</small>
              </v-chip>
            </template>
            <template v-else>
              --
            </template>
          </template>

          <template #[`item.metadata.filament_type`]="{ value }">
            {{ value || '--' }}
          </template>

          <template #[`item.metadata.filament_total`]="{ value }">
            {{
              value != null
                ? $filters.getReadableLengthString(value)
                : '--'
            }}
          </template>

          <template #[`item.metadata.filament_change_count`]="{ value }">
            {{ value?.toString() || '--' }}
          </template>

          <template #[`item.metadata.filament_weight_total`]="{ value }">
            {{
              value != null
                ? $filters.getReadableWeightString(value)
                : '--'
            }}
          </template>

          <template #[`item.metadata.filament_weights`]="{ value }">
            <template v-if="value != null && value.length > 0">
              <v-chip
                v-for="(weigth, index) in value"
                :key="index"
                class="mr-1"
                small
              >
                {{ $filters.getReadableWeightString(weigth) }}
              </v-chip>
            </template>
            <template v-else>
              --
            </template>
          </template>

          <template #[`item.metadata.mmu_print`]="{ value }">
            {{ value?.toString() || '--' }}
          </template>

          <template #[`item.metadata.referenced_tools`]="{ value }">
            <template v-if="value != null && value.length > 0">
              <v-chip
                v-for="(tool, index) in value"
                :key="index"
                class="mr-1"
                small
              >
                {{ tool }}
              </v-chip>
            </template>
            <template v-else>
              --
            </template>
          </template>

          <template #[`item.metadata.nozzle_diameter`]="{ value }">
            {{
              value != null
                ? `${value} mm`
                : '--'
            }}
          </template>

          <template #[`item.metadata.slicer`]="{ value }">
            {{ value || '--' }}
          </template>

          <template #[`item.metadata.slicer_version`]="{ value }">
            {{ value || '--' }}
          </template>

          <template #[`item.metadata.estimated_time`]="{ value }">
            {{
              value != null
                ? $filters.formatCounterSeconds(value)
                : '--'
            }}
          </template>

          <template #[`item.metadata.first_layer_bed_temp`]="{ value }">
            <template v-if="value != null">
              {{ value }}<small>°C</small>
            </template>
            <template v-else>
              --
            </template>
          </template>

          <template #[`item.metadata.first_layer_extr_temp`]="{ value }">
            <template v-if="value != null">
              {{ value }}<small>°C</small>
            </template>
            <template v-else>
              --
            </template>
          </template>

          <template #[`item.metadata.chamber_temp`]="{ value }">
            <template v-if="value != null">
              {{ value }}<small>°C</small>
            </template>
            <template v-else>
              --
            </template>
          </template>

          <template #[`item.metadata.file_processors`]="{ value }">
            <template v-if="value != null && value.length > 0">
              <v-chip
                v-for="(processor, index) in value"
                :key="index"
                class="mr-1"
                small
              >
                {{ $filters.prettyCase(processor) }}
              </v-chip>
            </template>
            <template v-else>
              --
            </template>
          </template>

          <template #[`item.metadata.modified`]="{ value }">
            {{ $filters.formatDateTime(value * 1000) }}
          </template>

          <template #[`item.metadata.size`]="{ value }">
            {{ $filters.getReadableFileSizeString(value) }}
          </template>

          <template #[`item.data-table-default`]="{ header, value }">
            {{ getFormattedValue(item, header, value) }}
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

@Component({
  components: {
    JobHistoryItemStatus
  }
})
export default class JobHistory extends Mixins(FilesMixin) {
  search = ''

  get auxiliaryDataHeaders (): AppDataTableHeader[] {
    const auxiliaryDataHeaders = this.history
      .reduce((headers, item) => {
        if (item.auxiliary_data) {
          for (const auxiliaryDataItem of item.auxiliary_data) {
            headers[auxiliaryDataItem.name] = auxiliaryDataItem.description
          }
        }

        return headers
      }, {} as Record<string, string>)

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

    const mergedTableHeaders: AppDataTableHeader[] = this.$store.getters['config/getMergedTableHeaders'](headers, 'history')

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
    return this.$store.getters['sensors/getSensors']
  }

  get history (): HistoryItem[] {
    return this.$store.getters['history/getHistory']
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
    this.$store.dispatch('history/clearHistoryThumbnails', job.job_id)
  }

  getFormattedValue (item: HistoryItem, header: AppDataTableHeader, value: unknown) {
    const auxiliaryDataItemName = header.value.startsWith('auxiliary_data.')
      ? header.value.substring(15)
      : undefined
    const auxiliaryDataItem = auxiliaryDataItemName && item.auxiliary_data
      ? item.auxiliary_data
        .find(x => x.name === auxiliaryDataItemName)
      : undefined

    value = auxiliaryDataItem
      ? auxiliaryDataItem.value
      : value

    if (value == null || value === '') {
      return '--'
    }

    const units = auxiliaryDataItem?.units
      ? ` ${auxiliaryDataItem.units}`
      : ''

    if (typeof value === 'number') {
      return `${Math.round(value * 100) / 100}${units}`
    }

    return `${value}${units}`
  }
}
</script>
