<template>
  <v-dialog
    v-model="open"
    :max-width="500"
    scrollable
  >
    <v-form>
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
    </v-form>
  </v-dialog>
</template>

<script lang="ts">
import { MCU } from '@/store/printer/types'
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
