<template>
  <v-menu
      v-model="menu"
      bottom
      left
      offset-y
      :close-on-content-click="false"
    >
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          color="primary"
          outlined
          small
          v-bind="attrs"
          v-on="on"
        >
          {{ $t('app.setting.btn.select_theme') }}
        </v-btn>
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
export default class CameraSettingsCard extends Vue {
  @Prop({ type: String, required: true })
  value!: string

  menu = false

  @Debounce(500)
  handleChange (value: { hex: string }) {
    this.$emit('input', value.hex)
    this.$emit('change', value.hex)
  }
}
</script>
