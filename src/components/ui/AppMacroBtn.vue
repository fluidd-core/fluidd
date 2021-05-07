<template>
  <app-btn
    v-if="params.length === 0 || !enableParams"
    @click="$emit('click', macro.name)"
  >
    <slot></slot>
  </app-btn>
  <app-btn-group
    v-else
    :elevation="6"
  >
    <app-btn
      @click="$emit('click', macro.name)"
    >
      <slot></slot>
    </app-btn>
    <v-menu
      left
      offset-y
      transition="slide-x-transition"
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
        <!-- <v-card-title class="card-heading py-2">
          <span class="focus--text">params</span>
        </v-card-title> -->
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
          </v-text-field>
        </v-card-text>
        <v-divider />
        <v-card-actions class="px-3 py-3">
          <!-- <app-btn block>{{ macro.name }}</app-btn> -->
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
import { Component, Vue, Prop } from 'vue-property-decorator'
import { Macro } from '@/store/macros/types'

@Component({})
export default class AppMacroBtn extends Vue {
  @Prop({ type: Object, required: true })
  macro!: Macro

  @Prop({ type: Boolean, default: false })
  enableParams!: boolean;

  params: { name: string; value: any }[] = []

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
    if (!this.macro.config) return []
    const params = Object.keys(this.macro.config)
      .filter(key => key.startsWith('default_parameter_'))
      .map(key => {
        return {
          name: key.substring(18).toUpperCase(),
          value: this.macro.config[key]
        }
      })
    this.params = params
  }
}
</script>
