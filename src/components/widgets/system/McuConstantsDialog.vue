<template>
  <app-dialog
    v-model="open"
    :title="$t('app.system_info.label.mcu_information', {mcu: mcu.name})"
    max-width="500"
    no-actions
  >
    <v-card-text>
      <v-simple-table dense>
        <tbody>
          <template v-for="constant in constants">
            <tr :key="constant[0]">
              <th>{{ constant[0] }}</th>
              <td>{{ constant[1] }}</td>
            </tr>
          </template>
        </tbody>
      </v-simple-table>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import type { MCU } from '@/store/printer/types'
import { Component, Prop, VModel, Vue } from 'vue-property-decorator'

@Component({})
export default class McuConstantsDialog extends Vue {
  @VModel({ type: Boolean, default: false })
    open!: boolean

  @Prop({ type: Object, required: true })
  readonly mcu!: MCU

  get constants () {
    return Object.entries(this.mcu.mcu_constants)
  }
}
</script>
