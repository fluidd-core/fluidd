<template>
  <v-dialog
    :value="value"
    @input="$emit('input', value)"
    :max-width="320"
  >
    <v-form
      class="mt-3"
      ref="addInstanceForm"
      v-model="valid"
      @submit.prevent="handleSave"
    >
      <v-card>
        <v-card-title class="card-heading py-2">
          <span class="focus--text">{{ title }}</span>
        </v-card-title>

        <v-card-text class="py-4">
          <v-text-field
            autofocus
            outlined
            v-model="newName"
            :label="label"
            :rules="rules"
            hide-details="auto"
            required
          />
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <app-btn
            color="warning"
            text
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

@Component({})
export default class FileNameDialog extends Mixins(StateMixin) {
  @Prop({ type: Boolean, required: true })
  value!: boolean

  @Prop({ type: String, required: true })
  title!: string

  @Prop({ type: String, required: true })
  label!: string

  @Prop({ type: Array, required: false })
  rules!: []

  @Prop({ type: String, required: true })
  name!: string

  newName = ''
  valid = false

  mounted () {
    this.newName = this.name
  }

  handleSave () {
    if (this.valid) {
      this.$emit('save', this.newName)
      this.$emit('input', false)
    }
  }
}
</script>
