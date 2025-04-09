<template>
  <collapsable-card
    v-if="sdInfo != null && Object.keys(sdInfo).length > 0"
    :title="$t('app.file_system.label.sd_card_info')"
    icon="$microSd"
  >
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
import type { SystemInfo } from '@/store/server/types'

@Component({})
export default class SdInfoCard extends Vue {
  get sdInfo () {
    const info: SystemInfo | null = this.$typedState.server.system_info

    return info?.sd_info
  }
}
</script>
