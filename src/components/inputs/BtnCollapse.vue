<template>
  <v-btn
    @click="emitChange(!value)"
    fab small text>
    <v-icon v-if="!value">$chevronUp</v-icon>
    <v-icon v-if="value">$chevronDown</v-icon>
  </v-btn>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class BtnCollapse extends Vue {
  @Prop({ default: false })
  value!: boolean

  emitChange (value: boolean) {
    this.$emit('input', value)
  }
}
</script>
