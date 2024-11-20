<template>
  <collapsable-card
    :title="$t('app.file_system.label.diskinfo')"
    icon="$harddisk"
  >
    <v-card-text>
      <v-layout justify-space-between>
        <div class="">
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
        <div class="">
          <span class="focus--text">
            {{ $filters.getReadableFileSizeString(fileSystemUsage.used) }}
          </span>
          <span class="secondary--text">{{ $t('app.general.label.used') }}</span>
        </div>
        <div class="">
          <span class="focus--text">
            {{ $filters.getReadableFileSizeString(fileSystemUsage.free) }}
          </span>
          <span class="secondary--text">{{ $t('app.general.label.free') }}</span>
        </div>
      </v-layout>
    </v-card-text>

    <v-simple-table dense>
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

@Component({})
export default class PrinterStatsCard extends Vue {
  get sdInfo () {
    const info = this.$store.getters['server/getSystemInfo']
    return info?.sd_info || {}
  }

  get fileSystemUsedPercent () {
    const total = this.fileSystemUsage.total
    const used = this.fileSystemUsage.used
    return Math.floor((used / total) * 100).toFixed()
  }

  get fileSystemUsage () {
    return this.$store.getters['files/getUsage']
  }
}
</script>
