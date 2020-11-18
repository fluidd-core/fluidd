<template>
  <v-card-text class="d-flex flex-wrap align-center justify-start pt-5">
    <v-btn
      v-for="(macro, index) in macros"
      :key="index"
      @click="sendGcode(macro, `${waits.onMacro}${macro}`)"
      :loading="hasWait(`${waits.onMacro}${macro}`)"
      color="secondary"
      class="me-2 mb-2">{{ macro.replaceAll('_', ' ') }}</v-btn>
  </v-card-text>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import { Waits } from '@/globals'

@Component({})
export default class MacrosWidget extends Mixins(UtilsMixin) {
  waits = Waits

  get macros () {
    return this.$store.getters['socket/getVisibleMacros']
  }
}
</script>
