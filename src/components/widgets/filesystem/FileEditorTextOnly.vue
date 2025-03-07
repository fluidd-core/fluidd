<template>
  <textarea
    v-model="content"
    class="v-input v-textarea px-2"
    :class="{
      [$vuetify.theme.dark ? 'theme--dark': 'theme--light']: true,
    }"
    :readonly="readonly"
    spellcheck="false"
  />
</template>

<script lang="ts">
import { Vue, Component, Prop, VModel } from 'vue-property-decorator'

@Component({})
export default class FileEditorText extends Vue {
  @VModel({ type: String })
  content?: string

  @Prop({ type: Boolean })
  readonly readonly?: boolean

  mounted () {
    this.$emit('ready')
  }
}
</script>

<style lang="scss" scoped>
  :deep() {
    font-family: monospace;
    font-size: 1rem;
    font-weight: 100 !important;
    min-width: 100%;
    height: calc(100% - 48px) !important;
    resize: none;
  }
</style>
