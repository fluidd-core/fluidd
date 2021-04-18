<template>
  <v-menu
      v-model="menu"
      bottom
      left
      :close-on-content-click="false"
    >
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          v-if="!dot"
          color="primary"
          outlined
          small
          v-bind="attrs"
          v-on="on"
        >
          {{ title }}
        </v-btn>
        <v-icon
          v-else
          v-bind="attrs"
          v-on="on"
          :color="value"
        >
          $circle
        </v-icon>
      </template>
      <v-color-picker
        :value="value"
        @update:color="handleChange"
        mode="hexa"
        hide-mode-switch
        canvas-height="100"
        dot-size="25"
      >
      </v-color-picker>
  </v-menu>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { Debounce } from 'vue-debounce-decorator'

@Component({
  components: {}
})
export default class AppColorPicker extends Vue {
  @Prop({ type: String, required: true })
  value!: string

  @Prop({ type: String, default: '' })
  title!: string

  @Prop({ type: Boolean, default: false })
  dot!: boolean

  menu = false

  @Debounce(500)
  handleChange (value: { hex: string }) {
    this.$emit('input', value.hex)
    this.$emit('change', value.hex)
  }
}
</script>
