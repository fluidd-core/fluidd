<template>
  <app-dialog
    v-model="open"
    :title="filename"
    :width="calculatedWidth"
    no-actions
  >
    <v-card-text class="py-4">
      <v-layout
        v-if="!isMarkdown"
        justify-center
      >
        <video
          v-if="isVideo"
          controls
        >
          <source
            :src="src"
            :type="type"
          >
        </video>

        <img
          v-else-if="isImage"
          :src="src"
        >

        <div v-else>
          {{ $t('app.general.simple_form.msg.no_file_preview', { name: (extension ? `.${extension} files` : filename) }) }}
        </div>
      </v-layout>

      <template v-else-if="isMarkdown">
        <promise-wrapper :promise="resultPromise">
          <template #default="{result}">
            <div
              class="markdown-container"
              v-html="result"
            />
          </template>
        </promise-wrapper>
      </template>
    </v-card-text>

    <template v-if="file">
      <v-divider />

      <v-card-actions class="pt-4">
        <v-spacer />
        <app-btn
          v-if="!readonly"
          text
          color="error"
          @click="$emit('remove', file)"
        >
          <v-icon>$delete</v-icon>
          {{ $t('app.general.btn.remove') }}
        </app-btn>
        <app-btn
          color="primary"
          @click="$emit('download', file)"
        >
          <v-icon>$download</v-icon>
          {{ $t('app.general.btn.download') }}
        </app-btn>
      </v-card-actions>
    </template>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Prop, Mixins, VModel } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { AppFile } from '@/store/files/types'
import { Marked, type MarkedExtension } from 'marked'
import { baseUrl } from 'marked-base-url'

@Component({})
export default class FilePreviewDialog extends Mixins(StateMixin) {
  @VModel({ type: Boolean })
    open?: boolean

  @Prop({ type: String, required: true })
  readonly path!: string

  @Prop({ type: Object })
  readonly file?: AppFile

  @Prop({ type: String, required: true })
  readonly filename!: string

  @Prop({ type: String })
  readonly extension?: string

  @Prop({ type: String, required: true })
  readonly src!: string

  @Prop({ type: String, required: true })
  readonly type!: string

  @Prop({ type: Number })
  readonly width?: number

  @Prop({ type: Boolean })
  readonly readonly?: boolean

  resultPromise: Promise<string> | null = null

  get calculatedWidth () {
    const defaultWidth = window.innerWidth * (this.$vuetify.breakpoint.mdAndDown ? 1 : 0.75)
    return Math.min(window.innerWidth * 0.9, Math.max(this.width ?? defaultWidth, defaultWidth / 2))
  }

  get isVideo () {
    return this.type.startsWith('video/')
  }

  get isImage () {
    return this.type.startsWith('image/')
  }

  get isMarkdown () {
    return this.type.startsWith('text/markdown')
  }

  get apiUrl (): string {
    return this.$store.state.config.apiUrl as string
  }

  async LoadMarkdown () {
    const response = await fetch(this.src)
    const data = await response.text()

    const apiFileUrl = `${this.apiUrl}/server/files/${this.path}/`

    const baseUrlExtension = baseUrl(apiFileUrl)

    const customExtension: MarkedExtension = {
      renderer: {
        link (...args) {
          const html = this.constructor.prototype.link.call(this, ...args)

          return html.replace(/^<a /, '<a target="_blank" ')
        }
      }
    }

    const marked = new Marked(baseUrlExtension, customExtension)

    this.resultPromise = marked.parse(data, {
      async: true
    }) as Promise<string>
  }

  mounted () {
    if (this.isMarkdown) {
      this.LoadMarkdown()
    }
  }
}
</script>

<style lang="scss" scoped>
video, img {
  max-width: 100%;
  max-height: calc(90vh - 144px);
}

:deep(.markdown-container) {
  img {
    max-width: 100% !important;
  }

  table {
    border-collapse: collapse;

    th, td {
      border: 1px solid;
      padding: 2px 6px;
    }
  }

  pre > code {
    display: block;
  }

  * {
    margin-bottom: 1em;
  }
}
</style>
