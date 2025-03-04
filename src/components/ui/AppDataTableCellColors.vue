<template>
  <div>
    <v-tooltip
      v-for="(color, index) in colors"
      :key="index"
      top
    >
      <template #activator="{ on, attrs }">
        <app-chip-color
          v-bind="{...$attrs, ...attrs}"
          :color="color"
          :class="{
            'ms-1': index > 0
          }"
          v-on="{...$listeners, ...on }"
        />
      </template>
      <span>{{ color }}</span>
    </v-tooltip>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({
  inheritAttrs: false
})
export default class AppDataTableCellColors extends Vue {
  @Prop({ type: Array, required: true })
  readonly colors!: string[]
}
</script>
