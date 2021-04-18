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
        <!-- :to="{ path: '/settings', hash: 'macros', params: { behavior: 'auto' } }" -->
        <v-icon small>$left</v-icon>
      </app-btn>
      {{ category }} {{ $t('app.setting.title.macros') }}

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
      :current-category="(category !== 'uncategorized') ? category : undefined"
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
  const category = to.params.category || 'uncategorized'
  const categories = store.getters['macros/getCategories']
  const i = categories.findIndex((c: MacroCategory) => c.name.toLowerCase() === category.toLowerCase())
  return (i > -1 || category === 'uncategorized')
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
  category = ''

  moveDialogState: any = {
    open: false,
    macro: null
  }

  get macros () {
    const cat = (this.category !== 'uncategorized') ? this.category : undefined
    const cats = this.$store.getters['macros/getMacrosByCategory'](cat)
      .filter((macro: Macro) => (!this.search || this.search === '') ? true : macro.name.includes(this.search.toLowerCase()))
    return cats
  }

  get categories () {
    return this.$store.getters['macros/getCategories']
  }

  beforeRouteEnter (to: any, from: any, next: any) {
    next(routeGuard(to))
  }

  beforeRouteUpdate (to: any, from: any, next: any) {
    next(routeGuard(to))
  }

  created () {
    this.search = ''
    this.category = this.$route.params.category
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
    if (category) {
      newMacro.category = category.name
    } else {
      delete newMacro.category
    }
    this.$store.dispatch('macros/saveMacro', newMacro)
    this.moveDialogState.open = false
    this.moveDialogState.macro = null
  }
}
</script>
