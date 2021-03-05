<template>
  <v-btn
    :block="block"
    :depressed="depressed"
    :fab="fab"
    :icon="icon"
    :loading="loading"
    :outlined="outlined"
    :plain="plain"
    :retainFocusOnClick="retainFocusOnClick"
    :rounded="rounded"
    :tile="tile"
    :disabled="disabled"
    :color="(color) ? color : 'default'"
    :min-width="minWidth"
    :class="{ 'grey--text text--darken-3': !colorIsDark, 'grey--text text--lighten-2': colorIsDark }"
    @click="$emit('click', $event)"
  >
    <slot></slot>
  </v-btn>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class FluiddBtn extends Vue {
  @Prop({ default: false })
  block!: boolean

  @Prop({ default: false })
  depressed!: boolean

  @Prop({ default: false })
  fab!: boolean

  @Prop({ default: false })
  icon!: boolean

  @Prop({ default: false })
  loading!: boolean

  @Prop({ default: false })
  outlined!: boolean

  @Prop({ default: false })
  plain!: boolean

  @Prop({ default: false })
  retainFocusOnClick!: boolean

  @Prop({ default: false })
  rounded!: boolean

  @Prop({ default: false })
  tile!: boolean

  @Prop({ default: false })
  disabled!: string

  @Prop({ default: false })
  color!: string

  @Prop({ type: Number })
  minWidth!: number

  get theme () {
    return this.$store.getters['config/getTheme']
  }

  get colorIsDark () {
    return this.$filters.colorDark(this.theme.currentTheme[this.color])
  }
}
</script>
