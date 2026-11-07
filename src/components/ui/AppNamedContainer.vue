<template>
  <v-row
    class="app-named-container"
    no-gutters
  >
    <v-col
      cols="12"
      sm="5"
      align-self="center"
      class="text-body-1"
      :class="{ 'text--disabled': disabled }"
    >
      <slot name="label">
        <span class="text-pre-wrap">{{ label }}</span>
      </slot>
    </v-col>
    <v-col>
      <slot />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({})
export default class AppNamedContainer extends Vue {
  @Prop({ type: String })
  readonly label?: string

  @Prop({ type: Boolean })
  readonly disabled?: boolean
}
</script>
