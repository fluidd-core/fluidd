<template>
  <app-dialog
    v-if="newMacro"
    v-model="open"
    :title="newMacro.name.toUpperCase()"
    :sub-title="newMacro.config.description"
    max-width="480"
    @save="handleSave"
  >
    <v-card-text class="pa-0">
      <app-setting
        :title="$t('app.general.label.alias')"
      >
        <v-text-field
          v-model="newMacro.alias"
          dense
          filled
          hide-details
        />
      </app-setting>

      <v-divider />

      <app-setting
        :title="$t('app.general.label.category')"
      >
        <v-select
          v-model="newMacro.categoryId"
          :items="categories"
          hide-details
          dense
          filled
          item-value="id"
          item-text="name"
        />
      </app-setting>

      <v-divider />

      <app-setting
        :title="$t('app.general.label.color')"
      >
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

      <!-- <app-setting
          title="Assign to"
        >
          <v-select
            :items="['Console', 'Tool', 'Bed mesh controls']"
            v-model="assign"
            clearable
            hide-details
            dense
            filled
          ></v-select>
        </app-setting>

        <v-divider /> -->

      <app-setting
        :title="$t('app.general.label.disabled_while_printing')"
      >
        <v-switch
          v-model="newMacro.disabledWhilePrinting"
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
          v-model="newMacro.visible"
          class="mt-0 pt-0"
          color="primary"
          hide-details
        />
      </app-setting>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import type { Macro } from '@/store/macros/types'
import { Component, Vue, Prop, VModel } from 'vue-property-decorator'

@Component({})
export default class MacroMoveDialog extends Vue {
  @VModel({ type: Boolean })
  open?: boolean

  @Prop({ type: Object, required: true })
  readonly macro!: Macro

  assign = null
  newMacro: Macro | null = null

  mounted () {
    this.newMacro = { ...this.macro }
  }

  get categories () {
    // Grabs all categories and filters by the currently defined one.
    const categories = [...this.$store.getters['macros/getCategories']]
    categories.unshift({ name: this.$t('app.general.label.uncategorized'), id: '0' })
    return categories
  }

  get color () {
    if (this.newMacro && this.newMacro.color !== '') {
      return this.newMacro.color
    }
    return this.$vuetify.theme.currentTheme.secondary?.toString()
  }

  set color (value: string | undefined) {
    if (this.newMacro) this.newMacro.color = value
  }

  handleResetColor () {
    if (this.newMacro) this.newMacro.color = ''
  }

  handleSave () {
    this.$store.dispatch('macros/saveMacro', this.newMacro)
    this.open = false
  }
}
</script>
