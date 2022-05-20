<template>
  <textarea
    class="editor v-input v-textarea px-2"
    :class="{'theme--dark': $vuetify.theme.dark}"
    :readonly="readonly"
    :value="value"
    :spellcheck="false"
    @change="emitChange($event.target.value)"
  />
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component({})
export default class FileEditorText extends Vue {
  @Prop({ type: String, required: true })
  value!: string;

  @Prop({ type: Boolean, default: false })
  readonly!: boolean;

  emitChange (value: string | undefined) {
    this.$emit('change', value)
    this.$emit('input', value)
  }

  mounted () {
    this.$emit('ready')
  }
}
</script>

<style lang="scss" scoped>
  .editor {
    font-family: monospace;
    font-size: 1rem;
    font-weight: 100 !important;
    min-width: 100%;
    height: calc(100% - 48px) !important;
    resize: none;
  }
</style>
