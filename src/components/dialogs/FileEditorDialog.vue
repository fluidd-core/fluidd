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
        dense
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
        <v-toolbar-items>
          <btn
            v-if="!readonly && !printerPrinting"
            :href="$globals.DOCS_KLIPPER_CONFIG_REF"
            target="_blank">
            <v-icon small left>$help</v-icon>
            {{ $t('app.general.btn.config_reference') }}
          </btn>
          <btn
            v-if="!readonly && !printerPrinting"
            @click="emitSave(newContents, true)">
            <v-icon small left>$restart</v-icon>
            {{ $t('app.general.btn.save_restart') }}
          </btn>
          <btn
            v-if="!readonly"
            @click="emitSave(newContents, false)">
            <v-icon small left>$save</v-icon>
            {{ $t('app.general.btn.save') }}
          </btn>
          <btn
            v-if="!readonly && !printerPrinting"
            @click="emitClose()">
            <v-icon small left>$close</v-icon>
            {{ $t('app.general.btn.close') }}
          </btn>
        </v-toolbar-items>
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
import StateMixin from '@/mixins/state'
import FileEditorWidget from '@/components/widgets/FileEditorWidget.vue'

@Component({
  components: {
    FileEditorWidget
  }
})
export default class FileEditorDialog extends Mixins(StateMixin) {
  @Prop({ type: Boolean, required: true })
  public value!: boolean

  @Prop({ type: String, required: true })
  public filename!: string;

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

  emitSave (contents: string, restart: boolean) {
    this.$emit('save', contents, restart)
    if (restart) this.$emit('input', false)
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
