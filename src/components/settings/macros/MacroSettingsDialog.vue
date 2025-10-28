<template>
  <app-dialog
    v-model="open"
    :title="macro.name.toUpperCase()"
    :sub-title="macro.description"
    max-width="480"
    @save="handleSave"
  >
    <v-card-text class="pa-0">
      <app-setting :title="$t('app.general.label.alias')">
        <v-text-field
          v-model="macro.alias"
          dense
          filled
          hide-details
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.general.label.category')">
        <v-select
          v-model="macro.categoryId"
          :items="categories"
          hide-details
          dense
          filled
          item-value="id"
          item-text="name"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.general.label.color')">
        <app-btn
          outlined
          small
          color="primary"
          class="mr-1"
          @click="handleResetColor"
        >
          {{ $t('app.setting.btn.reset') }}
        </app-btn>
        <app-color-picker
          v-model="color"
          :title="$t('app.general.btn.set_color')"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.general.label.disabled_while_printing')">
        <v-switch
          v-model="macro.disabledWhilePrinting"
          class="mt-0 pt-0"
          color="primary"
          hide-details
        />
      </app-setting>

      <v-divider />

      <app-setting
        :title="$t('app.general.label.visible')"
      >
        <v-switch
          v-model="macro.visible"
          class="mt-0 pt-0"
          color="primary"
          hide-details
        />
      </app-setting>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import type { Macro, MacroCategory } from '@/store/macros/types'
import { Component, Vue, Prop, VModel } from 'vue-property-decorator'

@Component({})
export default class MacroMoveDialog extends Vue {
  @VModel({ type: Boolean })
  open?: boolean

  @Prop({ type: Object, required: true })
  readonly macro!: Macro

  get categories () {
    // Grabs all categories and filters by the currently defined one.
    const categories: MacroCategory[] = [...this.$typedGetters['macros/getCategories']]
    categories.unshift({ name: this.$t('app.general.label.uncategorized').toString(), id: '0' })
    return categories
  }

  get color (): string | undefined {
    return this.macro.color || this.$vuetify.theme.currentTheme.secondary?.toString()
  }

  set color (value: string | undefined) {
    this.macro.color = value
  }

  handleResetColor () {
    this.macro.color = undefined
  }

  handleSave () {
    this.$typedDispatch('macros/saveMacro', this.macro)
    this.open = false
  }
}
</script>
