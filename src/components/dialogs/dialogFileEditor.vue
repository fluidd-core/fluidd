<template>
  <v-dialog
    @input="emitChange(value)"
    :value="value"
    :loading="loading"
    hide-overlay
    fullscreen
    transition="dialog-bottom-transition"
    content-class="config-editor-overlay"
  >
    <v-card d-flex color="black">
      <v-toolbar
        dark
        dense
        color="secondary"
      >
        <v-btn
          icon
          dark
          @click="emitClose()"
        >
          <v-icon>$close</v-icon>
        </v-btn>
        <v-toolbar-title>{{ filename }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          v-if="!readonly && unsavedChanges"
          dark
          color="error"
          @click="emitSave(newContents, filename, path)">
          Save
        </v-btn>
      </v-toolbar>
      <v-card-text>
        <file-editor-widget
          v-model="newContents"
          :fileExtension="fileExtension"
          :readonly="readonly">
        </file-editor-widget>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import FileEditorWidget from '@/components/widgets/configuration/FileEditorWidget.vue'

@Component({
  components: {
    FileEditorWidget
  }
})
export default class DialogFileEditor extends Mixins(UtilsMixin) {
  @Prop({ type: Boolean, required: true })
  public value!: boolean

  @Prop({ type: String, required: true })
  public filename!: string;

  @Prop({ type: String, required: true })
  public path!: string;

  @Prop({ type: String, required: true })
  public contents!: string

  @Prop({ type: Boolean, default: false })
  public loading!: boolean

  @Prop({ type: Boolean, default: false })
  public readonly!: boolean

  newContents = ''

  @Watch('contents')
  onValueChange (val: string) {
    this.newContents = val
  }

  mounted () {
    this.newContents = this.contents
  }

  get unsavedChanges () {
    return (this.newContents !== this.contents)
  }

  get fileExtension () {
    return this.filename.split('.').pop()
  }

  emitClose () {
    this.$emit('input', false)
  }

  emitSave (contents?: string, filename?: string, path?: string) {
    this.$emit('save', contents, filename, path)
  }
}
</script>

<style lang="scss" scoped>
  .config-editor-overlay div.v-card {
    position: relative;
    header {
      position: sticky;
      top: 0;
      width: 100%;
      z-index: 1;
    }
  }
</style>
