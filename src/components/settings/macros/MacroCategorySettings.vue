<template>
  <div>
    <v-subheader class="px-0">
      <app-btn
        fab
        small
        class="mr-4"
        @click="handleBack"
      >
        <v-icon dense>
          $left
        </v-icon>
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
        spellcheck="false"
        append-icon="$magnify"
        @focus="$event.target.select()"
      />
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
          @click="handleAllOff"
        >
          {{ $t('app.setting.label.all_off') }}
        </app-btn>

        <app-btn
          outlined
          small
          color="primary"
          class="ml-2"
          @click="handleAllOn"
        >
          {{ $t('app.setting.label.all_on') }}
        </app-btn>
      </app-setting>

      <app-draggable
        v-model="macros"
        :options="{
          group: `macro-settings-${category.name}`,
        }"
      >
        <section
          v-for="macro in macros"
          :key="macro.name"
        >
          <v-divider />

          <app-setting
            :accent-color="macro.color"
            :r-cols="2"
            @click="handleSettingsDialog(macro)"
          >
            <template #title>
              <app-drag-icon class="me-1" />
              {{ macro.name.toUpperCase() }}
            </template>

            <template
              v-if="macro.config?.description && macro.config.description !== 'G-Code macro'"
              #sub-title
            >
              <span class="ml-1 mr-2">
                {{ macro.config.description }}
              </span>
            </template>

            <v-switch
              class="mt-0 pt-0"
              :input-value="macro.visible"
              color="primary"
              hide-details
              @click.stop
              @change="handleMacroVisible(macro, $event)"
            />
          </app-setting>
        </section>
      </app-draggable>
    </v-card>

    <macro-settings-dialog
      v-if="dialogState.open"
      v-model="dialogState.open"
      :macro="dialogState.macro"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import MacroSettingsDialog from './MacroSettingsDialog.vue'
import type { Macro, MacroCategory } from '@/store/macros/types'
import store from '@/store'
import type { NavigationGuardNext, Route, Location } from 'vue-router'

const routeGuard = (to: Route): Parameters<NavigationGuardNext>[0] => {
  // No need to translate here, these are just used for the route.
  const id = to.params.categoryId
  const categories: MacroCategory[] = store.getters['macros/getCategories']
  const i = categories.findIndex(c => c.id === id)
  if (id !== '0' && i === -1) {
    return { name: 'settings', hash: '#macros' } satisfies Location
  }
}

@Component({
  components: {
    MacroSettingsDialog
  }
})
export default class MacroCategorySettings extends Vue {
  search = ''
  categoryId?: string = undefined

  dialogState: any = {
    open: false,
    macro: null
  }

  get macrosForCategory (): Macro[] {
    const id = this.categoryId

    return this.$typedGetters['macros/getMacrosByCategory'](id)
  }

  get macros () {
    return this.macrosForCategory
      .filter((macro: Macro) => !this.search ? true : macro.name.includes(this.search.toLowerCase()))
  }

  set macros (macros: Macro[]) {
    this.$typedDispatch('macros/saveAllOrder', macros)
  }

  get categories (): MacroCategory[] {
    return this.$typedGetters['macros/getCategories']
  }

  get category () {
    const category = this.categoryId !== '0' && this.categories.find(category => category.id === this.categoryId)

    return category || {
      id: '0', name: this.$tc('app.general.label.uncategorized')
    }
  }

  beforeRouteEnter (to: Route, from: Route, next: NavigationGuardNext) {
    next(routeGuard(to))
  }

  beforeRouteUpdate (to: Route, from: Route, next: NavigationGuardNext) {
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
    this.dialogState = {
      open: true,
      macro: { ...macro }
    }
  }

  handleAllOn () {
    this.$typedDispatch('macros/saveAllOn', this.macros)
  }

  handleAllOff () {
    this.$typedDispatch('macros/saveAllOff', this.macros)
  }

  handleMacroVisible (macro: Macro, value: boolean) {
    const newMacro = {
      ...macro, visible: value
    }
    this.$typedDispatch('macros/saveMacro', newMacro)
  }
}
</script>
