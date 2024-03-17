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
            v-for="name in parts"
            :key="name"
          >
            <td
              :class="{
                'text--disabled': isPartExcluded(name),
                'info--text': isPartCurrent(name)
              }"
              class="partName"
            >
              {{ name }}
            </td>
            <td class="actions">
              <app-btn
                color=""
                x-small
                fab
                text
                :disabled="isPartExcluded(name)"
                @click="cancelObject(name)"
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
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins, VModel } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class ExcludeObjectDialog extends Mixins(StateMixin) {
  @VModel({ type: Boolean })
    open?: boolean

  get parts () {
    const parts = this.$store.getters['parts/getParts']
    return Object.keys(parts)
  }

  isPartExcluded (name: string) {
    return this.$store.getters['parts/getIsPartExcluded'](name)
  }

  isPartCurrent (name: string) {
    return this.$store.getters['parts/getIsPartCurrent'](name)
  }

  async cancelObject (name: string) {
    const result = await this.$confirm(
      this.$tc('app.general.simple_form.msg.confirm_exclude_object'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (result) {
      const reqId = name.toUpperCase().replace(/\s/g, '_')

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
