<template>
  <v-dialog
    @input="$emit('input', $event)"
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
        <btn
          icon
          dark
          @click="emitClose()"
        >
          <v-icon>$close</v-icon>
        </btn>
        <v-toolbar-title>{{ filename }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <btn
          v-if="!readonly && unsavedChanges"
          :elevation="2"
          dark
          color="warning"
          class="ml-2"
          @click="emitSave(false, false, newContents, filename, path)">
          Save
        </btn>
        <btn
          v-if="!readonly && unsavedChanges"
          :elevation="2"
          dark
          color="warning"
          class="ml-2"
          @click="emitSave(true, false, newContents, filename, path)">
          Save &amp; Close
        </btn>
        <btn
          v-if="!readonly && unsavedChanges && !printerPrinting"
          :elevation="2"
          dark
          color="error"
          class="ml-2"
          @click="emitSave(true, true, newContents, filename, path)">
          Save &amp; Restart
        </btn>
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
import FileEditorWidget from '@/components/widgets/filesystem/FileEditorWidget.vue'

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

  emitSave (close: boolean, restart: boolean, contents?: string, filename?: string, path?: string) {
    this.$emit('save', restart, contents, filename, path)
    if (close) this.$emit('input', false)
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
