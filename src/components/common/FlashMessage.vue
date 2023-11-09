<template>
  <v-snackbar
    v-model="open"
    :color="type"
    :timeout="timeout"
    elevation="24"
    multi-line
    top
    centered
  >
    <span v-html="text" />

    <template #action="{ attrs }">
      <app-btn
        dark
        v-bind="attrs"
        @click="open = false"
      >
        {{ $t('app.general.btn.close') }}
      </app-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop, VModel } from 'vue-property-decorator'
import type { FlashMessageTypes } from '@/types'

@Component({})
export default class FlashMessage extends Vue {
  @VModel({ type: Boolean })
    open?: boolean

  @Prop({ type: String, default: 'dark' })
  readonly type!: FlashMessageTypes

  @Prop({ type: String, default: 'Saved!' })
  readonly text!: string

  @Prop({ type: Number, default: 1500 })
  readonly timeout!: number
}
</script>

<style lang="scss" scoped>
  :deep(.v-snack__wrapper .v-snack__content) {
    overflow: hidden;
    overflow-wrap: break-word;
  }
</style>
