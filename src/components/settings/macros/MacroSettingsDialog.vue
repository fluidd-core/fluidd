<template>
  <v-dialog
    :value="value"
    @input="$emit('input', $event)"
    :max-width="480"
    persistent
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
          :title="$t('app.general.label.alias')"
        >
          <v-text-field
            outlined
            v-model="newMacro.alias"
            filled
            dense
            single-line
            hide-details
          ></v-text-field>
        </app-setting>

        <v-divider />

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

        <app-setting
          :title="$t('app.general.label.color')"
        >
          <app-btn
            outlined
            small
            color="primary"
            @click="handleResetColor"
            class="mr-1"
          >
            {{ $t('app.setting.btn.reset') }}
          </app-btn>
          <app-color-picker
            :title="$t('app.general.btn.set_color')"
            :primary="color"
            @change="handleColorChange"
          >
          </app-color-picker>
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
            class="mt-0 pt-0"
            v-model="newMacro.disabledWhilePrinting"
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

  assign = null
  valid = false
  newMacro: Macro | null = null

  created () {
    this.newMacro = { ...this.macro }
  }

  @Watch('value')
  onOpen () {
    this.newMacro = { ...this.macro }
  }

  get categories () {
    // Grabs all categories and filters by the currently defined one.
    const categories = [...this.$store.getters['macros/getCategories']]
    categories.unshift({ name: this.$t('app.general.label.uncategorized'), id: '0' })
    return categories
  }

  get color () {
    const theme = this.$store.getters['config/getTheme']
    if (this.newMacro && this.newMacro.color !== '') {
      return this.newMacro.color
    }
    return theme.currentTheme.secondary
  }

  handleColorChange (color: any) {
    if (this.newMacro) this.newMacro.color = color.color.hexString
  }

  handleResetColor () {
    if (this.newMacro) this.newMacro.color = ''
  }

  handleSave () {
    this.$store.dispatch('macros/saveMacro', this.newMacro)
    this.$emit('input', false)
  }
}
</script>
