<template>
  <v-row v-if="toolChangeCommands.length > 0">
    <v-col
      v-for="(toolChangeCommandsGroup, index2) in toolChangeCommandsGrouped"
      :key="index2"
      cols="12"
    >
      <app-btn-group
        class="app-toolchanger-control d-flex"
        :class="{
          [$vuetify.theme.dark ? 'theme--dark': 'theme--light']: true,
        }"
      >
        <v-tooltip
          v-for="(macro, index) of toolChangeCommandsGroup"
          :key="index"
          top
        >
          <template #activator="{ on, attrs }">
            <app-btn
              v-bind="attrs"
              min-width="10"
              :color="macro.active ? 'primary' : undefined"
              :disabled="!klippyReady || printerPrinting"
              class="px-0 flex-grow-1"
              v-on="on"
              @click="sendGcode(macro.name)"
            >
              <v-icon
                v-if="macro.spoolId && getSpoolById(macro.spoolId)"
                class="mr-1 spool-icon"
                :color="getSpoolColor(getSpoolById(macro.spoolId))"
              >
                $filament
              </v-icon>
              <span
                v-else-if="macro.color"
                class="extruder-color mr-1"
                :class="{
                  active: macro.active
                }"
                :style="{
                  background: macro.color
                }"
              />
              {{ macro.name }}
            </app-btn>
          </template>
          {{ macro.description }}
        </v-tooltip>
      </app-btn-group>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { GcodeCommands } from '@/store/printer/types'
import type { TranslateResult } from 'vue-i18n'
import type { Spool } from '@/store/spoolman/types'
import { chunk } from 'lodash-es'
import type { Macro } from '@/store/macros/types'

type ToolChangeCommand = {
  name: string,
  description: string | TranslateResult,
  color?: string,
  active?: boolean,
  spoolId?: number
}

@Component({})
export default class ToolChangeCommands extends Mixins(StateMixin) {
  get availableCommands (): GcodeCommands {
    return this.$store.getters['printer/getAvailableCommands']
  }

  get toolChangeCommands (): ToolChangeCommand[] {
    const availableCommands = this.availableCommands

    return Object.keys(availableCommands)
      .filter(command => /^t\d+$/i.test(command))
      .map(command => {
        const { help } = availableCommands[command]
        const description = help && help !== 'G-Code macro'
          ? help
          : this.$t('app.tool.tooltip.select_tool', { tool: command.substring(1) })

        const macro: Macro | undefined = this.$store.getters['macros/getMacroByName'](command)

        return {
          name: command,
          description,
          color: macro?.variables?.color ? `#${macro.variables.color}` : undefined,
          active: macro?.variables?.active === true,
          spoolId: macro?.variables?.spool_id ? +macro.variables.spool_id : undefined
        } satisfies ToolChangeCommand
      })
      .sort((a, b) => {
        const numberA = parseInt(a.name.substring(1))
        const numberB = parseInt(b.name.substring(1))

        return numberA - numberB
      })
  }

  get toolChangeCommandsGrouped (): ToolChangeCommand[][] {
    const toolChangeCommands = this.toolChangeCommands

    const cols = Math.ceil(toolChangeCommands.length / Math.ceil(toolChangeCommands.length / 6))

    return chunk(toolChangeCommands, cols)
  }

  getSpoolById (id: number): Spool | undefined {
    return this.$store.getters['spoolman/getSpoolById'](id)
  }

  getSpoolColor (spool: Spool | undefined) {
    return `#${spool?.filament.color_hex ?? (this.$vuetify.theme.dark ? 'fff' : '000')}`
  }
}
</script>

<style lang="scss" scoped>
  @import 'vuetify/src/styles/styles.sass';

  @include theme(app-toolchanger-control) using ($material) {
    .extruder-color {
      border-color: map-deep-get($material, 'text', 'primary');
    }
  }

  .app-toolchanger-control .extruder-color {
    width: 15px;
    height: 15px;
    border-width: 1px;
    border-style: solid;
    border-radius: 50%;

    &.active {
      border-color: map-deep-get($material-dark, 'text', 'primary');
    }
  }
</style>
