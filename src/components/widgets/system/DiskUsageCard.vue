<template>
  <collapsable-card
    :title="$t('app.file_system.label.diskinfo')"
    icon="$harddisk"
  >
    <v-card-text v-if="diskUsage">
      <v-layout justify-space-between>
        <div>
          {{ $t('app.file_system.label.disk_usage') }}
        </div>
      </v-layout>

      <v-progress-linear
        :size="90"
        :height="10"
        :value="fileSystemUsedPercent"
        color="primary"
        class="my-1"
      />

      <v-layout justify-space-between>
        <div>
          <span class="focus--text">
            {{ $filters.getReadableFileSizeString(diskUsage.used) }}
          </span>
          <span class="secondary--text">{{ $t('app.general.label.used') }}</span>
        </div>
        <div>
          <span class="focus--text">
            {{ $filters.getReadableFileSizeString(diskUsage.free) }}
          </span>
          <span class="secondary--text">{{ $t('app.general.label.free') }}</span>
        </div>
      </v-layout>
    </v-card-text>

    <v-simple-table
      v-if="sdInfo"
      dense
    >
      <tbody>
        <tr v-if="sdInfo.manufacturer">
          <th>{{ $t('app.system_info.label.manufacturer') }}</th>
          <td>{{ sdInfo.manufacturer }}</td>
        </tr>
        <tr v-if="sdInfo.manufacturer_date">
          <th>{{ $t('app.system_info.label.manufactured') }}</th>
          <td>{{ sdInfo.manufacturer_date }}</td>
        </tr>
        <tr v-if="sdInfo.product_name">
          <th>{{ $t('app.system_info.label.product_name') }}</th>
          <td>{{ sdInfo.product_name }} {{ sdInfo.product_revision }}</td>
        </tr>
        <tr v-if="sdInfo.capacity">
          <th>{{ $t('app.system_info.label.capacity') }}</th>
          <td>{{ sdInfo.capacity }}</td>
        </tr>
        <tr v-if="sdInfo.serial_number">
          <th>{{ $t('app.system_info.label.serial_number') }}</th>
          <td>{{ sdInfo.serial_number }}</td>
        </tr>
      </tbody>
    </v-simple-table>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import type { SystemInfo } from '@/store/server/types'
import type { DiskUsage } from '@/store/files/types'
import { SocketActions } from '@/api/socketActions'

@Component({})
export default class PrinterStatsCard extends Vue {
  get sdInfo () {
    const info: SystemInfo | null = this.$store.state.server.system_info

    return info?.sd_info
  }

  get fileSystemUsedPercent () {
    const diskUsage = this.diskUsage

    return diskUsage == null
      ? 0
      : Math.floor((diskUsage.used / diskUsage.total) * 100)
  }

  get diskUsage (): DiskUsage | null {
    const diskUsage: DiskUsage | null = this.$store.state.files.disk_usage

    if (diskUsage == null) {
      SocketActions.serverFilesGetDirectory('config')
    }

    return diskUsage
  }
}
</script>
