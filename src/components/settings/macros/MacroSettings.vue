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
          @click="handleSettingsDialog(macro)"
        >
          <template v-slot:sub-title v-if="macro.config.description && macro.config.description !== 'G-Code macro'">
            <span
              v-show="true"
              class="mr-2"
            >
              {{ macro.config.description }}
            </span>
          </template>

          <v-switch
            class="mt-0 pt-0"
            :input-value="macro.visible"
            @click.stop
            @change="handleMacroVisible(macro, $event)"
            color="primary"
            hide-details
          ></v-switch>
        </app-setting>

        <v-divider :key="`divider-${macro.name}`" v-if="i < macros.length - 1 && macros.length > 0"></v-divider>
      </template>

    </v-card>

    <macro-settings-dialog
      v-if="dialogState.macro"
      v-model="dialogState.open"
      :macro="dialogState.macro"
    ></macro-settings-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import MacroSettingsDialog from './MacroSettingsDialog.vue'
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
    MacroSettingsDialog
  }
})
export default class MacroSettings extends Vue {
  search = ''
  categoryId: string | undefined = undefined

  dialogState: any = {
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

  handleSettingsDialog (macro: Macro) {
    this.dialogState.macro = macro
    this.dialogState.open = true
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
}
</script>
