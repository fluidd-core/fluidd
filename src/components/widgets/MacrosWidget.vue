<template>
  <v-card-text class="d-flex flex-wrap align-center justify-start pt-5">
    <template v-for="(macro, index) in macros">
      <btn
        v-if="macro.visible"
        :key="index"
        @click="sendGcode(macro.name, `${waits.onMacro}${macro.name}`)"
        :loading="hasWait(`${waits.onMacro}${macro.name}`)"
        :elevation="2"
        color="secondary"
        class="me-2 mb-2">
        {{ macro.name }}
      </btn>
    </template>
  </v-card-text>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Waits } from '@/globals'

@Component({})
export default class MacrosWidget extends Mixins(StateMixin) {
  waits = Waits

  get macros () {
    return this.$store.getters['macros/getMacros']
  }
}
</script>
