<template>
  <app-btn-group divided>
    <app-btn
      :disabled="(macro.disabledWhilePrinting && printerPrinting) || !klippyReady"
      :style="borderStyle"
      v-on="filteredListeners"
      @click="handleClick"
    >
      <slot />
    </app-btn>
    <v-menu
      v-if="hasParams"
      left
      offset-y
      transition="slide-y-transition"
      :close-on-content-click="false"
    >
      <template #activator="{ on, attrs, value }">
        <app-btn
          v-bind="attrs"
          min-width="24"
          class="px-0"
          :disabled="(macro.disabledWhilePrinting && printerPrinting) || !klippyReady"
          v-on="on"
        >
          <v-icon
            small
            :class="{ 'rotate-180': value }"
          >
            $chevronDown
          </v-icon>
        </app-btn>
      </template>
      <v-form @submit.prevent="$emit('click', runCommand)">
        <v-card>
          <v-card-text class="pb-3 px-3">
            <v-row
              v-for="(param, key) in params"
              :key="key"
              style="max-width: 150px;"
            >
              <v-col>
                <v-text-field
                  v-model="param.value"
                  :type="isBasicGcodeCommand && !paramNameForRawGcodeCommand ? 'number' : undefined"
                  :label="key"
                  persistent-placeholder
                  outlined
                  dense
                  hide-details="auto"
                  spellcheck="false"
                  class="console-command"
                  :append-icon="param.value !== param.reset ? '$reset' : undefined"
                  @click:append="param.value = param.reset"
                  @focus="$event.target.select()"
                />
              </v-col>
            </v-row>
          </v-card-text>
          <v-divider />
          <v-card-actions class="px-3 py-3">
            <app-btn
              block
              type="submit"
            >
              {{ $t('app.general.btn.send') }}
            </app-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-menu>
  </app-btn-group>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { Macro } from '@/store/macros/types'
import gcodeMacroParams from '@/util/gcode-macro-params'
import { gcodeCommandBuilder, isBasicGcodeCommand, getParamNameForRawGcodeCommand } from '@/util/gcode-helpers'
import type { KlippyApp } from '@/store/printer/types'

type MacroParameter = {
  value: string | number
  reset: string | number
}

@Component({})
export default class MacroBtn extends Mixins(StateMixin) {
  @Prop({ type: Object, required: true })
  readonly macro!: Macro

  params: Record<string, MacroParameter> = {}

  get hasParams () {
    return Object.keys(this.params).length > 0
  }

  get macroName () {
    return this.macro.name.toUpperCase()
  }

  get isBasicGcodeCommand () {
    return isBasicGcodeCommand(this.macroName)
  }

  get paramNameForRawGcodeCommand () {
    return getParamNameForRawGcodeCommand(this.macroName)
  }

  get filteredListeners () {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { click, ...listeners } = this.$listeners

    return listeners
  }

  /**
   * The formatted run command for a macro.
   */
  get runCommand () {
    return gcodeCommandBuilder(this.macroName, this.params)
  }

  get borderStyle () {
    if (this.macro && this.macro.color !== '') {
      return `border-color: ${this.macro.color} !important; border-left: solid 4px ${this.macro.color} !important;`
    }
    return ''
  }

  get klippyApp (): KlippyApp {
    return this.$store.getters['printer/getKlippyApp']
  }

  get supportsPythonGcodeMacros () {
    return this.klippyApp.isKalicoOrDangerKlipper
  }

  handleClick () {
    this.$emit('click', this.macroName)
  }

  mounted () {
    const gcode = this.macro.config?.gcode

    if (!gcode) return

    const paramNameForRawGcodeCommand = this.paramNameForRawGcodeCommand

    if (paramNameForRawGcodeCommand) {
      this.$set(this.params, paramNameForRawGcodeCommand, { value: '', reset: '' })
    } else {
      if (
        this.supportsPythonGcodeMacros &&
        /^\s*!/.test(gcode)
      ) {
        return
      }

      for (const { name, value } of gcodeMacroParams(gcode)) {
        if (!name.startsWith('_') && !this.params[name]) {
          this.$set(this.params, name, { value, reset: value })
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .macro-params {
    height: 160px;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
  }
  .macro-params > * {
    flex: 1 1 40px;
  }

  .console-command :deep(.v-text-field__slot input) {
    font-family: monospace;
  }
</style>
