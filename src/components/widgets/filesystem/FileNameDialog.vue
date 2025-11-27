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
        spellcheck="false"
        required
        @focus="handleFocus"
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

  @Prop({ type: Boolean })
  readonly isFile?: boolean

  newName = ''

  mounted () {
    this.newName = this.name
  }

  handleFocus (event: FocusEvent) {
    if (event.target instanceof HTMLInputElement) {
      const index = this.isFile
        ? event.target.value.lastIndexOf('.')
        : -1

      if (index > 0) {
        event.target.setSelectionRange(0, index)
      } else {
        event.target.select()
      }
    }
  }

  handleSave () {
    this.$emit('save', this.newName)
    this.open = false
  }
}
</script>
