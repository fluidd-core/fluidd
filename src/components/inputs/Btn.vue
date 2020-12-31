<template>
  <v-btn
    :elevation="2"
    :disabled="disabled"
    :loading="loading"
    :color="(color) ? color : 'default'"
    :block="block"
    :dark="dark"
    :fab="fab"
    :icon="icon"
    :outlined="outlined"
    :rounded="rounded"
    :plain="plain"
    :tile="tile"
    :class="classes"
    @click="$emit('click', $event)"
  >
    <slot></slot>
  </v-btn>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class Btn extends Vue {
  @Prop({ default: false })
  color!: string

  @Prop({ default: false })
  block!: boolean

  @Prop({ default: false })
  dark!: boolean

  @Prop({ default: false })
  fab!: boolean

  @Prop({ default: false })
  plain!: boolean

  @Prop({ default: false })
  icon!: boolean

  @Prop({ default: false })
  loading!: boolean

  @Prop({ default: false })
  outlined!: boolean

  @Prop({ default: false })
  rounded!: boolean

  @Prop({ default: false })
  tile!: boolean

  get classes () {
    return ''
  }

  // set classes (val: string) {

  // }
}
</script>
