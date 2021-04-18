<template>
  <v-dialog
    :value="value"
    @input="$emit('input', $event)"
    :max-width="350"
  >
    <v-card>
      <v-card-title class="card-heading py-2">
        <span class="focus--text">{{ $t('app.general.label.move_macro', { name: macro.name.toUpperCase() }) }}</span>
      </v-card-title>

      <v-divider />

      <!-- <pre>{{ categories }}</pre> -->

      <v-card-text>
        <v-select
          :items="categories"
          @change="handleCategorySelect"
          v-model="selected"
          label="Move to"
          item-value="name"
          item-text="name"
          return-object
        ></v-select>
      </v-card-text>

    </v-card>

    <pre> {{ currentCategory }} </pre>
  </v-dialog>
</template>

<script lang="ts">
import { Macro, MacroCategory } from '@/store/macros/types'
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class MacroMoveDialog extends Vue {
  @Prop({ type: Boolean, required: true })
  value!: boolean

  @Prop({ type: Object, required: true })
  macro!: Macro

  @Prop({ type: String, required: false })
  currentCategory!: string

  selected = null

  get categories () {
    // Grabs all categories and filters by the currently defined one.
    const categories = this.$store.getters['macros/getCategories']
      .filter((category: MacroCategory) => category.name !== this.currentCategory)

    // Adds an uncategorized category if a category is defined.
    if (this.currentCategory) {
      categories.unshift({ name: this.$t('app.general.label.uncategorized'), count: -1 })
    }

    return categories
  }

  handleCategorySelect (category: MacroCategory) {
    this.$emit('change', category)
    this.$emit('input', false)
    this.selected = null
  }
}
</script>
