<template>
  <div>
    <v-subheader id="macros">{{ $t('app.setting.title.macros') }}</v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6" class="py-0" v-for="(macro) in macros" :key="macro.name">
            <v-switch
              class="mt-0 mb-4"
              :input-value="macro.visible"
              @change="changeMacro(macro, $event)"
              :label="macro.name"
              color="primary"
              hide-details
            ></v-switch>
          </v-col>
        </v-row>
      </v-card-text>

      <v-list
        color="transparent"
      >
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>{{ $t('app.setting.label.toggle') }}</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action class="flex-row">
            <btn
              outlined
              small
              color="primary"
              @click="handleAllOff"
            >
              {{ $t('app.setting.label.all_off') }}
            </btn>

            <btn
              outlined
              small
              color="primary"
              @click="handleAllOn"
              class="ml-2"
            >
              {{ $t('app.setting.label.all_on') }}
            </btn>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Macro } from '@/store/macros/types'

@Component({
  components: {}
})
export default class MacroSettingsCard extends Mixins(StateMixin) {
  get macros () {
    return this.$store.getters['macros/getMacros']
  }

  changeMacro (macro: Macro, value: boolean) {
    const newMacro = { ...macro, visible: value }
    this.$store.dispatch('macros/saveMacro', newMacro)
  }

  handleAllOn () {
    this.$store.dispatch('macros/saveAllOn')
  }

  handleAllOff () {
    this.$store.dispatch('macros/saveAllOff')
  }
}
</script>
