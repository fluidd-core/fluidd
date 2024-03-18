<template>
  <collapsable-card
    :title="$t('app.general.title.system_overview')"
    icon="$desktopTower"
  >
    <template #menu>
      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <app-btn
            v-bind="attrs"
            color=""
            fab
            x-small
            text
            class="ms-1 my-1"
            v-on="on"
            @click="peripheralsDialogOpen = true"
          >
            <v-icon>$devices</v-icon>
          </app-btn>
        </template>
        <span>{{ $t('app.system_info.label.devices') }}</span>
      </v-tooltip>

      <v-tooltip
        v-if="canRolloverLogs"
        bottom
      >
        <template #activator="{ on, attrs }">
          <app-btn
            v-bind="attrs"
            color=""
            fab
            x-small
            text
            class="ms-1 my-1"
            :disabled="printerBusy"
            v-on="on"
            @click="rolloverLogsDialogOpen = true"
          >
            <v-icon>$fileRefresh</v-icon>
          </app-btn>
        </template>
        <span>{{ $t('app.general.tooltip.rollover_logs') }}</span>
      </v-tooltip>
    </template>
    <v-row no-gutters>
      <v-col>
        <v-simple-table dense>
          <tbody>
            <tr v-if="printerInfo.hostname">
              <th>{{ $t('app.system_info.label.hostname') }}</th>
              <td>{{ printerInfo.hostname }}</td>
            </tr>
            <tr v-if="cpuInfo.model">
              <th>{{ $t('app.system_info.label.model') }}</th>
              <td>{{ cpuInfo.model }}</td>
            </tr>
            <tr v-if="cpuInfo.cpu_desc">
              <th>{{ $t('app.system_info.label.cpu_desc') }}</th>
              <td>{{ cpuInfo.cpu_desc }}</td>
            </tr>
            <tr v-if="cpuInfo.total_memory">
              <th>{{ $t('app.system_info.label.total_memory') }}</th>
              <td>{{ $filters.getReadableFileSizeString(cpuInfo.total_memory * 1024) }}</td>
            </tr>
            <tr v-if="cpuInfo.hardware_desc">
              <th>{{ $t('app.system_info.label.hardware_desc') }}</th>
              <td>{{ cpuInfo.hardware_desc }}</td>
            </tr>
            <tr v-if="cpuInfo.bits && cpuInfo.processor && cpuInfo.cpu_count">
              <th>{{ $t('app.system_info.label.processor_desc') }}</th>
              <td>{{ cpuInfo.bits }} {{ cpuInfo.processor }} with {{ cpuInfo.cpu_count }} cores</td>
            </tr>
            <tr v-if="distribution.name">
              <th>{{ $t('app.system_info.label.operating_system') }}</th>
              <td>{{ distribution.name }}</td>
            </tr>
            <tr v-if="distributionName">
              <th>{{ $t('app.system_info.label.distribution_name') }}</th>
              <td>
                {{ distributionName }}
              </td>
            </tr>
            <tr v-if="distribution.like">
              <th>{{ $t('app.system_info.label.distribution_like') }}</th>
              <td>{{ distribution.like }}</td>
            </tr>
            <tr v-if="distribution.codename">
              <th>{{ $t('app.system_info.label.distribution_codename') }}</th>
              <td>{{ distribution.codename }}</td>
            </tr>
            <tr v-if="network">
              <th>{{ $t('app.system_info.label.network') }}</th>
              <td>{{ network }}</td>
            </tr>
            <tr v-if="virtualization.virt_type && virtualization.virt_type !== 'none'">
              <th>{{ $t('app.system_info.label.virtualization') }}</th>
              <td>{{ virtualization.virt_type }} ({{ virtualization.virt_identifier }})</td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-col>
      <v-col>
        <v-card-text>
          <system-control />
        </v-card-text>
      </v-col>
    </v-row>

    <rollover-logs-dialog
      v-if="rolloverLogsDialogOpen"
      v-model="rolloverLogsDialogOpen"
    />

    <peripherals-dialog
      v-if="peripheralsDialogOpen"
      v-model="peripheralsDialogOpen"
    />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import type { SystemInfo, CpuInfo, DistroInfo, Virtualization } from '@/store/server/types'
import StateMixin from '@/mixins/state'

@Component({})
export default class PrinterStatsCard extends Mixins(StateMixin) {
  rolloverLogsDialogOpen = false
  peripheralsDialogOpen = false

  get systemInfo (): SystemInfo | null {
    return this.$store.getters['server/getSystemInfo']
  }

  get cpuInfo () {
    return this.systemInfo?.cpu_info || {} as CpuInfo
  }

  get distribution () {
    return this.systemInfo?.distribution || {} as DistroInfo
  }

  get distributionName (): string | undefined {
    console.log(this.distribution)
    const { name, id } = this.distribution

    if (name) {
      if (name.startsWith('0.')) {
        return undefined
      }

      return `${(
        name.startsWith('#')
          ? id
          : name
      )} ${this.distribution.release_info?.version_id ?? ''}`
    }
  }

  get virtualization () {
    return this.systemInfo?.virtualization || {} as Virtualization
  }

  get network () {
    return Object.entries(this.systemInfo?.network || {})
      .map(([key, entry]) => {
        const ipAddresses = entry.ip_addresses?.filter(x => x.family === 'ipv4') || entry.ip_addresses?.filter(x => x.family === 'ipv6')

        return ipAddresses
          ? `${key} (${ipAddresses.map(x => x.address).join(', ')})`
          : key
      })
      .join(', ')
  }

  get printerInfo () {
    return this.$store.state.printer.printer.info
  }

  get canRolloverLogs (): boolean {
    return this.$store.getters['server/getIsMinApiVersion']('1.0.5') as boolean
  }
}
</script>
