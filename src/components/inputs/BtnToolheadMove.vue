<template>
  <v-tooltip
    top>
    <template v-slot:activator="{ on, attrs }">
      <v-badge
        color="orange"
        overlap
        bordered
        offset-x="15"
        offset-y="15"
        left
        :content="badge"
        :value="(badge !== '')"
      >
        <v-btn
          @click="$emit('click')"
          :disabled="disabled"
          :elevation="2"
          :min-width="40"
          :loading="loading"
          :color="color"
          v-bind="(tooltip !== '') ? attrs : undefined"
          v-on="(tooltip !== '') ? on : undefined"
          class="pa-0">
          <v-icon>{{ icon }}</v-icon>
          <slot></slot>
        </v-btn>
      </v-badge>
    </template>
    <span>{{ tooltip }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class BtnToolheadMove extends Vue {
  @Prop({ type: String, required: true })
  icon!: string

  @Prop()
  disabled!: boolean

  @Prop({ type: String, default: 'secondary' })
  color!: string

  @Prop({ type: Boolean, default: false })
  loading!: boolean

  @Prop({ type: String, default: '' })
  badge!: string

  @Prop({ type: String, default: '' })
  tooltip!: string
}
</script>
