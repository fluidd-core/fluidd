<template>
  <app-dialog
    v-model="open"
    :title="$t('app.general.label.save_as')"
    max-width="450"
    @save="handleSubmit()"
  >
    <v-card-text>
      <v-text-field
        v-model="name"
        autofocus
        filled
        required
        class="mb-4"
        :rules="[
          $rules.required
        ]"
        hide-details="auto"
        :label="$t('app.beacon.label.model_name')"
      />

      <v-checkbox
        v-model="removeDefault"
        :label="$t('app.beacon.label.remove_model', { name: existingName })"
        hide-details="auto"
        class="mb-4"
        :disabled="name === existingName"
      />

      <span>
        {{ $t('app.beacon.msg.hint', { name: existingName }) }}
      </span>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop, VModel } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'

@Component({})
export default class SaveModelDialog extends Mixins(StateMixin, ToolheadMixin) {
  @VModel({ type: Boolean })
  open?: boolean

  @Prop({ type: String })
  readonly existingName!: string

  mounted () {
    this.name = 'default'
    this.removeDefault = false
  }

  name = 'default'
  removeDefault = false

  handleSubmit () {
    this.$emit('save', { name: this.name, removeDefault: this.removeDefault })
    this.open = false
  }
}
</script>
