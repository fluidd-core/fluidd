<template>
  <div>
    <v-subheader class="px-0">
      <app-btn
        fab
        small
        color=""
        class="mr-4"
        exact
        @click="handleBack"
      >
        <v-icon small>$left</v-icon>
      </app-btn>

      {{ category.name }} {{ $t('app.setting.title.macros') }}

      <v-spacer />

      <v-text-field
        v-model="search"
        clearable
        outlined
        dense
        single-line
        hide-details
        append-icon="$magnify"
        class="v-input--width-small"
      >
      </v-text-field>

    </v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4">

      <app-setting>
        <app-btn
          outlined
          small
          color="primary"
          @click="handleAllOff"
        >
          {{ $t('app.setting.label.all_off') }}
        </app-btn>

        <app-btn
          outlined
          small
          color="primary"
          @click="handleAllOn"
          class="ml-2"
        >
          {{ $t('app.setting.label.all_on') }}
        </app-btn>
      </app-setting>

      <v-divider />

      <template v-for="(macro, i) in macros">
        <app-setting
          :key="`macro-${macro.name}`"
          :title="macro.name.toUpperCase()"
          :r-cols="2"
        >
          <!-- <app-color-picker
            v-if="macro"
            v-model="macro.color"
            dot
          >
          </app-color-picker> -->

          <v-btn
            v-if="categories.length > 0"
            fab
            x-small
            text
            @click="handleMoveDialog(macro)"
            class="mr-2"
          >
            <v-icon>$move</v-icon>
          </v-btn>

          <v-switch
            class="mt-0 pt-0"
            :input-value="macro.visible"
            @change="handleMacroVisible(macro, $event)"
            color="primary"
            hide-details
          ></v-switch>
        </app-setting>

        <v-divider :key="`divider-${macro.name}`" v-if="i < macros.length - 1 && macros.length > 0"></v-divider>
      </template>

    </v-card>

    <macro-move-dialog
      v-if="this.category && moveDialogState.macro"
      v-model="moveDialogState.open"
      :current-category="category"
      :macro="moveDialogState.macro"
      @change="handleMacroMove($event)"
    ></macro-move-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import MacroMoveDialog from './MacroMoveDialog.vue'
import { Macro, MacroCategory } from '@/store/macros/types'
import store from '@/store'

const routeGuard = (to: any) => {
  // No need to translate here, these are just used for the route.
  const id = to.params.categoryId
  const categories = store.getters['macros/getCategories']
  const i = categories.findIndex((c: MacroCategory) => c.id === id)
  return (i > -1 || id === '0')
    ? true
    : { path: '/settings', hash: 'macros' }
}

@Component({
  components: {
    MacroMoveDialog
  }
})
export default class MacroSettings extends Vue {
  search = ''
  categoryId: string | undefined = undefined

  moveDialogState: any = {
    open: false,
    macro: null
  }

  get macros () {
    const id = this.categoryId
    const macros = this.$store.getters['macros/getMacrosByCategory'](id)
      .filter((macro: Macro) => (!this.search || this.search === '') ? true : macro.name.toLowerCase().includes(this.search.toLowerCase()))
    return macros
  }

  get categories (): MacroCategory[] {
    return this.$store.getters['macros/getCategories']
  }

  get category (): MacroCategory | undefined {
    if (this.categoryId === '0') return { id: '0', name: this.$tc('app.general.label.uncategorized') }
    return this.categories.find(category => category.id === this.categoryId)
  }

  beforeRouteEnter (to: any, from: any, next: any) {
    next(routeGuard(to))
  }

  beforeRouteUpdate (to: any, from: any, next: any) {
    next(routeGuard(to))
  }

  created () {
    this.search = ''
    this.categoryId = this.$route.params.categoryId
  }

  handleBack () {
    this.$router.go(-1)
  }

  handleMoveDialog (macro: Macro) {
    this.moveDialogState.open = true
    this.moveDialogState.macro = macro
  }

  handleAllOn () {
    this.$store.dispatch('macros/saveAllOn', this.macros)
  }

  handleAllOff () {
    this.$store.dispatch('macros/saveAllOff', this.macros)
  }

  handleMacroVisible (macro: Macro, value: boolean) {
    const newMacro = {
      ...macro, visible: value
    }
    this.$store.dispatch('macros/saveMacro', newMacro)
  }

  handleMacroMove (category: MacroCategory) {
    // Define a copy of the macro.
    const newMacro = {
      ...this.moveDialogState.macro
    }

    // Are we moving to a category, or uncategorizing it?
    if (category.id === '0') {
      delete newMacro.categoryId
    } else {
      newMacro.categoryId = category.id
    }
    this.$store.dispatch('macros/saveMacro', newMacro)
    this.moveDialogState.open = false
    this.moveDialogState.macro = null
  }
}
</script>
