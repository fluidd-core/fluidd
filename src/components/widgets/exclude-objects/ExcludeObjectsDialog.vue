<template>
  <app-dialog
    v-model="open"
    :title="$t('app.gcode.label.exclude_object')"
    max-width="500"
    no-actions
  >
    <v-card-text>
      <v-simple-table>
        <tbody>
          <tr
            v-for="part in parts"
            :key="part.name"
          >
            <td
              :class="{
                'text--disabled': part.isExcluded,
                'info--text': part.isCurrent
              }"
              class="partName"
            >
              {{ part.name }}
            </td>
            <td class="actions">
              <app-btn
                icon
                :disabled="part.isExcluded"
                @click="cancelObject(part.name)"
              >
                <v-icon
                  dense
                  color="error"
                >
                  $cancelled
                </v-icon>
              </app-btn>
            </td>
          </tr>
        </tbody>
      </v-simple-table>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins, VModel } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { encodeGcodeParamValue } from '@/util/gcode-helpers'
import type { ExcludeObjectPart } from '@/store/printer/types'

@Component({})
export default class ExcludeObjectDialog extends Mixins(StateMixin) {
  @VModel({ type: Boolean })
  open?: boolean

  get parts (): ExcludeObjectPart[] {
    return this.$store.getters['printer/getExcludeObjectParts'] as ExcludeObjectPart[]
  }

  async cancelObject (name: string) {
    const result = await this.$confirm(
      this.$tc('app.general.simple_form.msg.confirm_exclude_object'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (result) {
      const reqId = name.toUpperCase().replace(/\s/g, '_')

      this.sendGcode(`EXCLUDE_OBJECT NAME=${encodeGcodeParamValue(reqId)}`)
    }
  }
}
</script>

<style lang="scss" scoped>
  .partName {
    word-break: break-all;
  }

  .actions {
    width: 32px;
  }
</style>
