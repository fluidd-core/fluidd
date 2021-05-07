<template>
  <v-dialog
    :value="value"
    @input="$emit('input', $event)"
    :max-width="350"
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

        <v-divider />

        <v-card-text>
          <v-text-field
            autofocus
            outlined
            v-model="newName"
            :label="label"
            :rules="rules"
            hide-details="auto"
            required>
          </v-text-field>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <app-btn color="warning" text @click="$emit('input', false)" type="button">{{ $t('app.general.btn.cancel') }}</app-btn>
          <app-btn color="primary" type="submit">{{ $t('app.general.btn.save') }}</app-btn>
        </v-card-actions>

      </v-card>
    </v-form>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class MacroCategoryDialog extends Vue {
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
  valid = true

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
