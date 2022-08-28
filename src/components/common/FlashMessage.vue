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
import { Component, Prop } from 'vue-property-decorator'

@Component({})
export default class FlashMessage extends Vue {
  @Prop({ type: Boolean })
  readonly value!: boolean

  @Prop({ type: String, default: 'dark' })
  readonly type!: string

  @Prop({ type: String, default: 'Saved!' })
  readonly text!: string

  @Prop({ type: Number, default: 1500 })
  readonly timeout!: number

  get open () {
    return this.$props.value
  }

  set open (value: boolean) {
    this.$emit('input', value)
  }
}
</script>

<style lang="scss" scoped>
  :deep(.v-snack__wrapper .v-snack__content) {
    overflow: hidden;
    overflow-wrap: break-word;
  }
</style>
