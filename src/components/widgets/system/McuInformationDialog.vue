<template>
  <app-dialog
    v-model="open"
    :title="$t('app.system_info.label.mcu_information', { mcu: mcu.prettyName })"
    max-width="500"
    no-actions
  >
    <v-card-text class="pa-0">
      <v-card flat>
        <v-card-title>{{ $t('app.system_info.label.constants') }}</v-card-title>

        <v-simple-table dense>
          <tbody>
            <tr
              v-for="(value, key) in mcu.mcu_constants"
              :key="key"
            >
              <th>{{ key }}</th>
              <td>{{ value }}</td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-card>

      <v-card flat>
        <v-card-title>{{ $t('app.system_info.label.last_stats') }}</v-card-title>

        <v-simple-table dense>
          <tbody>
            <tr
              v-for="(value, key) in mcu.last_stats"
              :key="key"
            >
              <th>{{ key }}</th>
              <td>{{ value }}</td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-card>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import type { MCU } from '@/store/printer/types'
import { Component, Prop, VModel, Vue } from 'vue-property-decorator'

@Component({})
export default class McuInformationDialog extends Vue {
  @VModel({ type: Boolean })
  open?: boolean

  @Prop({ type: Object, required: true })
  readonly mcu!: MCU
}
</script>
