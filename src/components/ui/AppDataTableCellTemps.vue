<template>
  <div class="app-data-table-cell-temps">
    <v-chip
      v-for="(temp, index) in temps"
      :key="index"
      :class="{
        'ms-1': index > 0
      }"
      small
      v-bind="$attrs"
      v-on="$listeners"
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
export default class AppDataTableCellTemps extends Vue {
  @Prop({ type: Array, required: true })
  readonly temps!: string[]
}
</script>
