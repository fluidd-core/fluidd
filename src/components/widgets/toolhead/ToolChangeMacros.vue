<template>
  <v-row v-if="toolChangeMacros.length > 0">
    <v-col>
      <app-btn-group>
        <app-btn
          v-for="(macro, index) of toolChangeMacros"
          :key="index"
          min-width="10"
          :color="macro.color"
          :disabled="!klippyReady || printerPrinting"
          class="px-0 flex-grow-1"
          @click="sendGcode(macro.name)"
        >
          {{ macro.name }}
        </app-btn>
      </app-btn-group>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Macro } from '@/store/macros/types'

const toolChangeMacroRegExp = /^t\d+$/i

type ToolChangeMacro = {
  name: string,
  color?: string,
  active?: boolean
}

@Component({})
export default class ToolChangeMacros extends Mixins(StateMixin) {
  get macros (): Macro[] {
    return this.$store.getters['macros/getMacros'] as Macro[]
  }

  get toolChangeMacros (): ToolChangeMacro[] {
    return this.macros
      .filter(macro => toolChangeMacroRegExp.test(macro.name))
      .map(macro => ({
        name: macro.name.toUpperCase(),
        color: macro.variables?.color ? `#${macro.variables.color}` : undefined,
        active: macro.variables?.active ?? false
      } as ToolChangeMacro))
      .sort((a, b) => {
        const numberA = parseInt(a.name.substring(1))
        const numberB = parseInt(b.name.substring(1))

        return numberA - numberB
      })
  }
}
</script>
