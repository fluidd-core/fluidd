<template>
  <app-dialog
    v-model="open"
    :title="title"
    max-width="320"
    @save="handleSave"
  >
    <v-card-text>
      <v-text-field
        v-model="newName"
        autofocus
        outlined
        :label="label"
        :rules="[
          $rules.required
        ]"
        required
      />
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop, VModel } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class FileNameDialog extends Mixins(StateMixin) {
  @VModel({ type: Boolean })
  open?: boolean

  @Prop({ type: String, required: true })
  readonly title!: string

  @Prop({ type: String, required: true })
  readonly label!: string

  @Prop({ type: String, required: true })
  readonly name!: string

  newName = ''

  mounted () {
    this.newName = this.name
  }

  handleSave () {
    this.$emit('save', this.newName)
    this.open = false
  }
}
</script>
