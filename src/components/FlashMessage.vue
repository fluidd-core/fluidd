<template>
  <v-snackbar
    v-model="open"
    :color="type"
    :timeout="timeout"
    top
  >
    {{ text }}

    <template v-slot:action="{ attrs }">
      <btn
        dark
        text
        v-bind="attrs"
        @click="open = false"
      >
        {{$t("btn.close")}}
      </btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

@Component({})
export default class FlashMessage extends Vue {
  @Prop({ type: Boolean })
  value!: boolean;

  @Prop({ type: String, default: 'success' })
  type!: string;

  @Prop({ type: String, default: 'Saved!' })
  text!: string;

  @Prop({ type: Number, default: 3000 })
  timeout!: number;

  get open () {
    return this.$props.value
  }

  set open (value: boolean) {
    this.$emit('input', value)
  }
}
</script>
