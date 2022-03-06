<template>
  <div>
    <v-subheader id="macros">
      {{ $t('app.setting.title.macros') }}
    </v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4"
    >
      <app-setting>
        <app-btn
          outlined
          small
          color="primary"
          @click="handleAddCategoryDialog"
        >
          <v-icon
            small
            left
          >
            $plus
          </v-icon>
          {{ $t('app.setting.btn.add_category') }}
        </app-btn>
      </app-setting>

      <v-divider />

      <!-- <pre>{{ categories }}</pre> -->

      <!-- Look through user categories.. -->
      <template
        v-for="category in categories"
      >
        <app-setting
          :key="`category-${category.name}`"
          :r-cols="3"
          @click="handleCategoryClick(category)"
        >
          <template v-slot:title>
            {{ category.name }}
            <v-chip
              small
              class="mr-4"
            >
              {{ category.visible }} / {{ category.count }}
            </v-chip>
          </template>

          <app-btn
            fab
            text
            x-small
            color=""
            @click.stop="handleEditCategoryDialog(category)"
          >
            <v-icon color="">
              $edit
            </v-icon>
          </app-btn>

          <app-btn
            fab
            text
            x-small
            color=""
            @click.stop="handleRemoveCategory(category)"
          >
            <v-icon color="">
              $close
            </v-icon>
          </app-btn>

          <!-- <v-icon>$chevronRight</v-icon> -->
        </app-setting>

        <v-divider :key="`divider-${category.name}`" />
      </template>

      <!-- Add the uncategorized macros.. -->
      <app-setting
        v-if="uncategorizedMacros.count > 0"
        :key="`category-uncategorized`"
        :r-cols="3"
        @click="handleCategoryClick()"
      >
        <template v-slot:title>
          {{ $t('app.general.label.uncategorized') }}
          <v-chip small>
            {{ uncategorizedMacros.visible }} / {{ uncategorizedMacros.count }}
          </v-chip>
        </template>
        <v-icon>$chevronRight</v-icon>
      </app-setting>

      <macro-category-dialog
        v-if="categoryDialogState.open"
        v-model="categoryDialogState.open"
        :title="categoryDialogState.title"
        :label="categoryDialogState.label"
        :name="categoryDialogState.name"
        :rules="categoryDialogState.rules"
        @save="categoryDialogState.handler"
      />
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import MacroCategoryDialog from './MacroCategoryDialog.vue'
import StateMixin from '@/mixins/state'
import { Macro, MacroCategory } from '@/store/macros/types'

@Component({
  components: {
    MacroCategoryDialog
  }
})
export default class MacroSettings extends Mixins(StateMixin) {
  categoryDialogState: any = {
    open: false,
    title: 'add',
    label: '',
    category: null,
    name: '',
    rules: [],
    handler: this.handleAddCategory
  }

  get categories () {
    return this.$store.getters['macros/getCategories']
  }

  get uncategorizedMacros () {
    const uncategorized = this.$store.getters['macros/getMacrosByCategory']()
    const count = uncategorized.length
    const visible = uncategorized.filter((macro: Macro) => macro.visible).length
    return {
      count,
      visible
    }
  }

  handleAddCategoryDialog () {
    this.categoryDialogState = {
      open: true,
      title: 'Add category',
      label: this.$t('app.general.label.name'),
      category: null,
      name: '',
      rules: [
        (v: string) => !!v || this.$t('app.general.simple_form.error.required'),
        (v: string) => this.categories.findIndex((c: MacroCategory) => c.name.toLowerCase() === v.toLowerCase()) < 0 || this.$t('app.general.simple_form.error.exists')
      ],
      handler: this.handleAddCategory
    }
  }

  handleEditCategoryDialog (category: MacroCategory) {
    this.categoryDialogState = {
      open: true,
      title: 'Edit category',
      label: this.$t('app.general.label.name'),
      category,
      name: category.name,
      rules: [
        (v: string) => !!v || this.$t('app.general.simple_form.error.required'),
        (v: string) => this.categories.findIndex((c: MacroCategory) => c.name.toLowerCase() === v.toLowerCase()) < 0 || this.$t('app.general.simple_form.error.exists')
      ],
      handler: this.handleEditCategory
    }
  }

  handleRemoveCategory (category: MacroCategory) {
    this.$store.dispatch('macros/removeCategory', category)
  }

  handleAddCategory (category: string) {
    this.$store.dispatch('macros/addCategory', category)
  }

  handleEditCategory (name: string) {
    const category = {
      ...this.categoryDialogState.category,
      name
    }
    this.$store.dispatch('macros/editCategory', category)
  }

  handleCategoryClick (category: MacroCategory) {
    const id = (category) ? category.id : 0
    this.$router.push(`/settings/macros/${id}`)
  }
}
</script>
