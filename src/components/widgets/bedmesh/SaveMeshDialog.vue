<template>
  <v-dialog
    :title="$t('app.general.label.save_as')"
    :value="value"
    :max-width="450"
    @input="$emit('input', $event)"
  >
    <v-form
      ref="saveMeshForm"
      v-model="valid"
      @submit.prevent="handleSubmit()"
    >
      <v-card>
        <v-card-title class="card-heading py-2">
          <span class="focus--text">{{ $t('app.general.label.save_as') }}</span>
        </v-card-title>

        <v-card-text class="mt-4">
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
            :label="$t('app.bedmesh.label.profile_name')"
          />

          <v-checkbox
            v-model="removeDefault"
            :label="$t('app.bedmesh.label.remove_profile', { name: existingName })"
            hide-details="auto"
            class="mb-4"
            :disabled="name === existingName"
          />

          <p>
            {{ $t('app.bedmesh.msg.hint', { name: existingName }) }}
          </p>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <app-btn
            color="warning"
            text
            type="button"
            @click="$emit('input', false)"
          >
            {{ $t('app.general.btn.cancel') }}
          </app-btn>
          <app-btn
            color="primary"
            type="submit"
          >
            {{ $t('app.general.btn.save') }}
          </app-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'

@Component({})
export default class SaveMeshDialog extends Mixins(StateMixin, ToolheadMixin) {
  @Prop({ type: Boolean, default: false })
  readonly value!: string

  @Prop({ type: String })
  readonly existingName!: string

  mounted () {
    this.name = 'default'
    this.removeDefault = false
  }

  valid = true
  name = 'default'
  removeDefault = false

  handleSubmit () {
    if (this.valid) {
      this.$emit('save', { name: this.name, removeDefault: this.removeDefault })
      this.$emit('input', false)
    }
  }
}
</script>
