<template>
  <v-dialog
    v-model="open"
    :max-width="500"
    scrollable
  >
    <v-form>
      <v-card>
        <v-card-title class="card-heading py-2">
          <span class="focus--text">{{ $t('app.gcode.label.exclude_object') }}</span>
        </v-card-title>

        <v-divider />

        <v-card-text class="py-3 px-5">
          <v-simple-table>
            <tbody>
              <tr
                v-for="part in parts"
                :key="part.name"
              >
                <td class="partName">
                  {{ part.name }}
                </td>
                <td class="actions">
                  <app-btn
                    color=""
                    x-small
                    fab
                    text
                    :disabled="isPartExcluded(part.name)"
                    @click="cancelObject(part.name)"
                  >
                    <v-icon color="error">
                      $cancelled
                    </v-icon>
                  </app-btn>
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-card-text>
      </v-card>
    </v-form>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Mixins, VModel } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class ExcludeObjectDialog extends Mixins(StateMixin) {
  @VModel({ type: Boolean, default: false })
    open!: boolean

  get parts () {
    return this.$store.getters['parts/getParts']
  }

  isPartExcluded (name: string) {
    return this.$store.getters['parts/getIsPartExcluded'](name)
  }

  async cancelObject (id: string) {
    const res = await this.$confirm(
      this.$tc('app.general.simple_form.msg.confirm_exclude_object'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (res) {
      const reqId = id.toUpperCase().replace(/\s/g, '_')

      this.sendGcode(`EXCLUDE_OBJECT NAME=${reqId}`)
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
