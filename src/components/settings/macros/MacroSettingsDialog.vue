<template>
  <v-dialog
    :value="value"
    @input="$emit('input', $event)"
    :max-width="480"
  >
    <v-form
      ref="form"
      @submit.prevent="handleSave"
      v-model="valid"
    >
      <v-card>
        <v-card-title class="card-heading py-2">
          <span class="focus--text">{{ newMacro.name.toUpperCase() }}</span>
        </v-card-title>
        <v-card-subtitle
          v-if="newMacro.config.description"
          class="card-heading pb-2"
        >
          {{ newMacro.config.description }}
        </v-card-subtitle>

        <v-divider />

        <!-- <pre>{{ newMacro }}</pre> -->

        <app-setting
          :title="$t('app.general.label.category')"
        >
          <v-select
            :items="categories"
            v-model="newMacro.categoryId"
            hide-details
            dense
            filled
            item-value="id"
            item-text="name"
          ></v-select>
        </app-setting>

        <v-divider />

        <!-- <app-color-picker
          v-if="macro"
          v-model="macro.color"
          dot
        >
        </app-color-picker> -->

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
            class="mt-0 pt-0"
            v-model="macro.disabledWhilePrinting"
            color="primary"
            hide-details
          ></v-switch>
        </app-setting>

        <v-divider />

        <app-setting
          :title="$t('app.general.label.visible')"
        >
          <v-switch
            class="mt-0 pt-0"
            v-model="newMacro.visible"
            color="primary"
            hide-details
          ></v-switch>
        </app-setting>

        <v-divider />

        <v-card-actions class="px-4">
          <v-spacer></v-spacer>
          <app-btn color="warning" text @click="$emit('input', false)" type="button" v-html="$t('app.general.btn.cancel')"></app-btn>
          <app-btn color="primary" type="submit" v-html="$t('app.general.btn.save')"></app-btn>
        </v-card-actions>

      </v-card>
    </v-form>
  </v-dialog>
</template>

<script lang="ts">
import { Macro } from '@/store/macros/types'
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'

@Component({})
export default class MacroMoveDialog extends Vue {
  @Prop({ type: Boolean, required: true })
  value!: boolean

  @Prop({ type: Object, required: true })
  macro!: Macro

  category = null
  assign = null
  valid = false
  newMacro: Macro | null = null

  @Watch('macro')
  onMacro (macro: Macro) {
    this.newMacro = macro
  }

  get categories () {
    // Grabs all categories and filters by the currently defined one.
    const categories = [...this.$store.getters['macros/getCategories']]
    categories.unshift({ name: this.$t('app.general.label.uncategorized'), id: '0' })
    return categories
  }

  created () {
    this.newMacro = { ...this.macro }
  }

  handleSave () {
    this.$store.dispatch('macros/saveMacro', this.newMacro)
    this.$emit('input', false)
  }
}
</script>
