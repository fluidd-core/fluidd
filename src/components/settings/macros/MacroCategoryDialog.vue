<template>
  <v-dialog
    v-model="value"
    :max-width="350"
  >
    <v-form
      ref="addInstanceForm"
      v-model="valid"
      class="mt-3"
      @submit.prevent="handleSave"
    >
      <v-card>
        <v-card-title class="card-heading py-2">
          <span class="focus--text">{{ title }}</span>
        </v-card-title>

        <v-divider />

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
            hide-details="auto"
            required
          />
        </v-card-text>

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
import { MacroCategory } from '@/store/macros/types'
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class MacroCategoryDialog extends Vue {
  @Prop({ type: Boolean, required: true })
  readonly value!: boolean

  @Prop({ type: String, required: true })
  readonly title!: string

  @Prop({ type: String, required: true })
  readonly label!: string

  @Prop({ type: String, required: true })
  readonly name!: string

  newName = ''
  valid = true

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
    if (this.valid) {
      this.$emit('save', this.newName)
      this.$emit('input', false)
    }
  }
}
</script>
