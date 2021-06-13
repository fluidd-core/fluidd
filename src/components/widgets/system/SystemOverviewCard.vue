<template>
  <collapsable-card
    :title="$t('app.general.title.system_overview')"
    icon="$chart">

    <v-row no-gutters>
      <v-col>
        <v-simple-table dense>
          <tbody>
            <tr>
              <th>{{ $t('app.system_info.label.hostname') }}</th>
              <td>{{ printerInfo.hostname }}</td>
            </tr>
            <tr>
              <th>{{ $t('app.system_info.label.model') }}</th>
              <td>{{ cpuInfo.model }}</td>
            </tr>
            <tr>
              <th>{{ $t('app.system_info.label.cpu_desc') }}</th>
              <td>{{ cpuInfo.cpu_desc }}</td>
            </tr>
            <tr>
              <th>{{ $t('app.system_info.label.total_memory') }}</th>
              <td>{{ cpuInfo.total_memory }} {{ cpuInfo.memory_units }}</td>
            </tr>
            <tr>
              <th>{{ $t('app.system_info.label.hardware_desc') }}</th>
              <td>{{ cpuInfo.hardware_desc }}</td>
            </tr>
            <tr>
              <th>{{ $t('app.system_info.label.processor_desc') }}</th>
              <td>{{ cpuInfo.bits }} {{ cpuInfo.processor }} with {{ cpuInfo.cpu_count }} cores</td>
            </tr>
            <tr>
              <th>{{ $t('app.system_info.label.distribution_name') }}</th>
              <td>{{ distribution.name }}</td>
            </tr>
            <tr>
              <th>{{ $t('app.system_info.label.distribution_codename') }}</th>
              <td>{{ distribution.codename }}</td>
            </tr>
            <tr>
              <th>{{ $t('app.system_info.label.distribution_like') }}</th>
              <td>{{ distribution.like }}</td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-col>
      <v-col>
        <v-card-text>
          <system-control></system-control>
        </v-card-text>
      </v-col>
    </v-row>

    <!-- <pre>{{ services }}</pre> -->
    <!-- <pre>{{ sdInfo }}</pre> -->
    <!-- <pre>{{ distribution }}</pre> -->
    <!-- <pre>{{ printerInfo }}</pre> -->

  </collapsable-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({})
export default class PrinterStatsCard extends Vue {
  get cpuInfo () {
    const info = this.$store.getters['server/getSystemInfo']
    return info?.cpu_info || {}
  }

  get sdInfo () {
    const info = this.$store.getters['server/getSystemInfo']
    return info?.sd_info || {}
  }

  get distribution () {
    const info = this.$store.getters['server/getSystemInfo']
    return info?.distribution || {}
  }

  get services () {
    const info = this.$store.getters['server/getSystemInfo']
    return info?.available_services || []
  }

  get printerInfo () {
    return this.$store.state.printer.printer.info
  }

  get fileSystemUsedPercent () {
    // (250 / 500) * 100
    const total = this.fileSystemUsage.total
    const used = this.fileSystemUsage.used
    return Math.floor((used / total) * 100).toFixed()
  }

  get fileSystemUsage () {
    return this.$store.getters['files/getUsage']
  }
}
</script>
