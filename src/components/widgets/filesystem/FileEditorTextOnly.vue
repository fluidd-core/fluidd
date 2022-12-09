<template>
  <textarea
    class="v-input v-textarea px-2"
    :class="{'theme--dark': $vuetify.theme.dark}"
    :readonly="readonly"
    :value="value"
    :spellcheck="false"
    @change="emitChange($event)"
  />
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component({})
export default class FileEditorText extends Vue {
  @Prop({ type: String, required: true })
  readonly value!: string

  @Prop({ type: Boolean, default: false })
  readonly readonly!: boolean

  emitChange (e: Event) {
    const element = e.target as HTMLTextAreaElement

    if (element) {
      this.$emit('change', element.value)
      this.$emit('input', element.value)
    }
  }

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
