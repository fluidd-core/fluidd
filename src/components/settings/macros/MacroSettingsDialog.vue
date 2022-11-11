<template>
  <v-dialog
    v-model="open"
    :max-width="480"
    persistent
  >
    <v-form
      ref="form"
      v-model="valid"
      @submit.prevent="handleSave"
    >
      <v-card v-if="newMacro">
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
            v-model="newMacro.alias"
            outlined
            filled
            dense
            single-line
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
            :title="$t('app.general.btn.set_color')"
            :primary="color"
            @change="handleColorChange"
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

        <v-divider />

        <v-card-actions class="px-4">
          <v-spacer />
          <app-btn
            color="warning"
            text
            type="button"
            @click="open = false"
            v-html="$t('app.general.btn.cancel')"
          />
          <app-btn
            color="primary"
            type="submit"
            v-html="$t('app.general.btn.save')"
          />
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>
</template>

<script lang="ts">
import { Macro } from '@/store/macros/types'
import { Component, Vue, Prop, Watch, VModel } from 'vue-property-decorator'

@Component({})
export default class MacroMoveDialog extends Vue {
  @VModel({ type: Boolean, required: true })
    open!: boolean

  @Prop({ type: Object, required: true })
  readonly macro!: Macro

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
    this.open = false
  }
}
</script>
