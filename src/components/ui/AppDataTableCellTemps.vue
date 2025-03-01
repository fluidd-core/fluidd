<template>
  <div>
    <v-chip
      v-for="(temp, index) in temps"
      :key="index"
      :class="{
        'ms-1': index > 0
      }"
      small
    >
      {{ temp }}<small>°C</small>
    </v-chip>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({
  inheritAttrs: false
})
export default class AppDataTableCellColors extends Vue {
  @Prop({ type: Array, required: true })
  readonly temps!: string[]
}
</script>
