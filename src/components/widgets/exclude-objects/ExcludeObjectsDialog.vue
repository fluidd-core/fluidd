<template>
  <v-dialog
    :value="value"
    max-width="500"
    persistent
  >
    <v-card>
      <v-card-title class="card-heading py-2 px-5">
        <v-icon left>
          $cancelled
        </v-icon>
        <span class="focus--text">
          {{ $t('app.gcode.label.exclude_object') }}
        </span>
      </v-card-title>

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
                  x-small
                  fab
                  :disabled="isPartExcluded(part.name)"
                  @click="$emit('cancelObject', part.name)"
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

      <v-divider />

      <v-card-actions class="py-2 px-5">
        <v-spacer />
        <app-btn
          color="primary"
          text
          @click="$emit('close')"
        >
          {{ $t('app.general.btn.close') }}
        </app-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class ExcludeObjectDialog extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: false })
  public value!: boolean

  get parts () {
    return this.$store.getters['parts/getParts']
  }

  isPartExcluded (name: string) {
    return this.$store.getters['parts/getIsPartExcluded'](name)
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
