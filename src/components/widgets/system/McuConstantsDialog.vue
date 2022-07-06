<template>
  <v-dialog
    :value="value"
    :max-width="500"
    scrollable
    @input="$emit('input', $event)"
  >
    <v-card>
      <v-card-title class="card-heading py-2">
        <span class="focus--text">{{ $t('app.system_info.label.mcu_information', {mcu: mcu.name}) }}</span>
      </v-card-title>

      <v-divider />

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
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { MCU } from '@/store/printer/types'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({})
export default class McuConstantsDialog extends Vue {
  @Prop({ type: Boolean, default: false })
  public value!: boolean

  @Prop({ type: Object, required: true })
  public mcu!: MCU

  get constants () {
    return Object.entries(this.mcu.mcu_constants)
  }
}
</script>
