<template>
  <app-btn
    v-if="params.length === 0 || !enableParams"
    :disabled="macro.disabledWhilePrinting && printerPrinting"
    @click="$emit('click', macro.name)"
  >
    <slot></slot>
  </app-btn>
  <app-btn-group
    v-else
    :elevation="6"
  >
    <app-btn
      :disabled="macro.disabledWhilePrinting && printerPrinting"
      @click="$emit('click', macro.name)"
    >
      <slot></slot>
    </app-btn>
    <v-menu
      left
      offset-y
      transition="slide-y-transition"
      :close-on-content-click="false"
    >
      <template v-slot:activator="{ on, attrs, value }">
        <app-btn
          v-if="params.length > 0"
          v-on="on"
          v-bind="attrs"
          :min-width="24"
          class="px-0"
        >
          <v-icon small :class="{ 'rotate-180': value }">$chevronDown</v-icon>
        </app-btn>
      </template>
      <v-card>
        <v-card-text class="pb-3 px-3">
          <v-text-field
            v-for="(param, i) in params"
            :key="param.name"
            :label="param.name"
            outlined
            dense
            hide-details="auto"
            v-model="param.value"
            class="v-input--width-small"
            :class="{ 'mb-3': (i < params.length - 1) }">

          <template v-slot:append>
            <app-btn
              @click="param.value = param.reset"
              style="margin-top: -4px; margin-right: -6px;"
              color=""
              icon
              small
            >
              <v-icon small>$reset</v-icon>
            </app-btn>

          </template>

          </v-text-field>
        </v-card-text>
        <v-divider />
        <v-card-actions class="px-3 py-3">
          <app-btn
            block
            @click="$emit('click', runCommand)"
          >
            Send
          </app-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </app-btn-group>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Macro } from '@/store/macros/types'

@Component({})
export default class AppMacroBtn extends Mixins(StateMixin) {
  @Prop({ type: Object, required: true })
  macro!: Macro

  @Prop({ type: Boolean, default: false })
  enableParams!: boolean;

  params: { name: string; value: any; reset: any }[] = []

  /**
   * The formatted run command for a macro.
   */
  get runCommand () {
    let s = this.macro.name
    if (this.params) {
      this.params.forEach((param) => {
        s += ` ${param.name}=${param.value}`
      })
    }
    return s
  }

  mounted () {
    if (!this.macro.config || !this.macro.config.gcode) return []
    if (this.macro.config.gcode) {
      const regex = /params\.(\w*)\|?(default\('?(\w*)'?\))?/gmi
      let match = regex.exec(this.macro.config.gcode)
      do {
        // console.log(match)
        if (match && match[1]) {
          const name = match[1]
          const value = match[3] || ''
          this.params.push({ name, value, reset: value })
        }
      } while (
        (match = regex.exec(this.macro.config.gcode)) !== null
      )
    }
  }
}
</script>
