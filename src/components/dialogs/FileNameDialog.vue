<template>
  <v-dialog
    :value="value"
    @input="$emit('input', value)"
    :max-width="320"
    persistent
  >
    <v-form
      class="mt-3"
      ref="addInstanceForm"
      v-model="valid"
      @submit.prevent="handleSave"
    >
      <v-card>
        <v-card-title>
          <span class="headline">{{ title }}</span>
        </v-card-title>
        <v-card-text>

          <v-text-field
            autofocus
            outlined
            v-model="newName"
            :label="label"
            :rules="rules"
            required>
          </v-text-field>

        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <btn color="warning" text @click="$emit('input', false)">{{ $t('Cancel') }}</btn>
          <btn color="primary" type="submit">{{ $t('Save') }}</btn>
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
