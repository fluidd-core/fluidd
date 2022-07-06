<template>
  <v-dialog
    :value="value"
    :max-width="350"
    @input="$emit('input', $event)"
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
            :rules="rules"
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
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class MacroCategoryDialog extends Vue {
  @Prop({ type: Boolean, required: true })
  public value!: boolean

  @Prop({ type: String, required: true })
  public title!: string

  @Prop({ type: String, required: true })
  public label!: string

  @Prop({ type: Array, required: false })
  public rules!: []

  @Prop({ type: String, required: true })
  public name!: string

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
