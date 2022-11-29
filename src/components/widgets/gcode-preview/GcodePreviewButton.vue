<template>
  <v-tooltip bottom>
    <template #activator="{ on, attrs }">
      <v-btn
        v-bind="attrs"
        icon
        small
        tabindex="-1"
        :disabled="disabled"
        :color="property ? 'primary' : undefined"
        v-on="on"
        @click="property = !property"
      >
        <v-icon>{{ icon }}</v-icon>
      </v-btn>
    </template>
    <span>{{ tooltip }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({})
export default class GcodePreviewButton extends Vue {
  @Prop({ type: String, required: true })
  readonly name!: string

  @Prop({ type: String, required: true })
  readonly icon!: string

  @Prop({ type: String, required: true })
  readonly tooltip!: string

  @Prop({ type: Boolean, default: false })
  readonly disabled!: boolean

  get property () {
    return this.$store.getters['gcodePreview/getViewerOption'](this.name)
  }

  set property (value) {
    this.$store.commit('gcodePreview/setViewerState', { [this.name]: value })
  }
}
</script>
