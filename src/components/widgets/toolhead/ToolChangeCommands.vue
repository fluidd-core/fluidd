<template>
  <v-row v-if="toolChangeCommands.length > 0">
    <v-col>
      <app-btn-group
        class="app-toolchanger-control d-flex"
        :class="{
          [$vuetify.theme.dark ? 'theme--dark': 'theme--light']: true,
        }"
      >
        <v-tooltip
          v-for="(macro, index) of toolChangeCommands"
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
              <span
                v-if="macro.color"
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

type ToolChangeCommand = {
  name: string,
  description: string,
  color?: string,
  active?: boolean
}

@Component({})
export default class ToolChangeCommands extends Mixins(StateMixin) {
  get toolChangeCommands (): ToolChangeCommand[] {
    const availableCommands = this.$store.state.console.availableCommands

    return Object.keys(availableCommands)
      .filter(command => /^t\d+$/i.test(command))
      .map(command => {
        const description = availableCommands[command] !== 'G-Code macro'
          ? availableCommands[command]
          : this.$t('app.tool.tooltip.select_tool', { tool: command.substring(1) })

        const macro = this.$store.getters['macros/getMacroByName'](command.toLowerCase())

        return {
          name: command,
          description,
          color: macro?.variables?.color ? `#${macro.variables.color}` : undefined,
          active: macro?.variables?.active ?? false
        } satisfies ToolChangeCommand
      })
      .sort((a, b) => {
        const numberA = parseInt(a.name.substring(1))
        const numberB = parseInt(b.name.substring(1))

        return numberA - numberB
      })
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
