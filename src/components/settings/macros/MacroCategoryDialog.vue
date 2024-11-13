<template>
  <app-dialog
    v-model="open"
    :title="title"
    max-width="350"
    @save="handleSave"
  >
    <v-card-text>
      <v-text-field
        v-model="newName"
        autofocus
        outlined
        :label="label"
        :rules="[
          $rules.required,
          customRules.uniqueName
        ]"
        required
      />
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import type { MacroCategory } from '@/store/macros/types'
import { Component, Vue, Prop, VModel } from 'vue-property-decorator'

@Component({})
export default class MacroCategoryDialog extends Vue {
  @VModel({ type: Boolean })
  open?: boolean

  @Prop({ type: String, required: true })
  readonly title!: string

  @Prop({ type: String, required: true })
  readonly label!: string

  @Prop({ type: String, required: true })
  readonly name!: string

  newName = ''

  get customRules () {
    return {
      uniqueName: (v: string) => this.categories.findIndex((c: MacroCategory) => c.name.toLowerCase() === v.toLowerCase()) < 0 || this.$t('app.general.simple_form.error.exists')
    }
  }

  mounted () {
    this.newName = this.name
  }

  get categories () {
    return this.$store.getters['macros/getCategories']
  }

  handleSave () {
    this.$emit('save', this.newName)
    this.open = false
  }
}
</script>
