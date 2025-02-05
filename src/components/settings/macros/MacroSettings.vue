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

      <app-draggable
        v-model="categories"
        :options="{
          group: `macro-settings`,
        }"
      >
        <section
          v-for="category in categories"
          :key="`category-${category.name}`"
        >
          <v-divider />

          <app-setting
            :r-cols="3"
            @click="handleCategoryClick(category)"
          >
            <template #title>
              <app-drag-icon class="me-1" />
              {{ category.name }}
              <v-chip
                small
                class="ms-1 me-4"
              >
                {{ category.visible }} / {{ category.count }}
              </v-chip>
            </template>

            <app-btn
              icon
              @click.stop="handleEditCategoryDialog(category)"
            >
              <v-icon dense>
                $edit
              </v-icon>
            </app-btn>

            <app-btn
              icon
              @click.stop="handleRemoveCategory(category)"
            >
              <v-icon dense>
                $delete
              </v-icon>
            </app-btn>
          </app-setting>
        </section>
      </app-draggable>

      <template v-if="uncategorizedMacros.count > 0">
        <v-divider />

        <!-- Add the uncategorized macros.. -->
        <app-setting
          :key="`category-uncategorized`"
          :r-cols="3"
          @click="handleCategoryClick()"
        >
          <template #title>
            {{ $t('app.general.label.uncategorized') }}
            <v-chip
              small
              class="ms-1"
            >
              {{ uncategorizedMacros.visible }} / {{ uncategorizedMacros.count }}
            </v-chip>
          </template>
          <v-icon
            dense
            class="pa-1"
          >
            $chevronRight
          </v-icon>
        </app-setting>
      </template>

      <macro-category-dialog
        v-if="categoryDialogState.open"
        v-model="categoryDialogState.open"
        :title="categoryDialogState.title"
        :label="categoryDialogState.label"
        :name="categoryDialogState.name"
        @save="categoryDialogState.handler"
      />
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import MacroCategoryDialog from './MacroCategoryDialog.vue'
import StateMixin from '@/mixins/state'
import type { Macro, MacroCategory } from '@/store/macros/types'

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
    handler: this.handleAddCategory
  }

  get categories (): MacroCategory[] {
    return this.$store.getters['macros/getCategories']
  }

  set categories (value: MacroCategory[]) {
    const categories = value
      .map(({ id, name }) => ({
        id,
        name
      }))

    this.$store.dispatch('macros/updateCategories', categories)
  }

  get uncategorizedMacros () {
    const uncategorized: Macro[] = this.$store.getters['macros/getMacrosByCategory']()
    const count = uncategorized.length
    const visible = uncategorized.filter(macro => macro.visible).length
    return {
      count,
      visible
    }
  }

  handleAddCategoryDialog () {
    this.categoryDialogState = {
      open: true,
      title: this.$t('app.general.label.add_category'),
      label: this.$t('app.general.label.name'),
      category: null,
      name: '',
      handler: this.handleAddCategory
    }
  }

  handleEditCategoryDialog (category: MacroCategory) {
    this.categoryDialogState = {
      open: true,
      title: this.$t('app.general.label.edit_category'),
      label: this.$t('app.general.label.name'),
      category,
      name: category.name,
      handler: this.handleEditCategory
    }
  }

  async handleRemoveCategory (category: MacroCategory) {
    const result = await this.$confirm(
      this.$t('app.general.simple_form.msg.confirm_remove_macro_category', { name: category.name }).toString(),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (result) {
      this.$store.dispatch('macros/removeCategory', category)
    }
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

  handleCategoryClick (category?: MacroCategory) {
    const categoryId = category?.id ?? '0'
    this.$router.push({
      name: 'macro_category_settings',
      params: {
        categoryId
      }
    })
  }
}
</script>
