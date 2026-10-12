<template>
  <v-dialog
    v-model="open"
    :scrollable="scrollable"
    v-bind="$attrs"
    :fullscreen="isMobileViewport"
    :transition="isMobileViewport ? 'dialog-bottom-transition' : undefined"
    content-class="app-dlg-frame"
  >
    <v-form
      ref="form"
      v-model="validModel"
      :disabled="disabled"
      @submit.prevent="handleSave"
    >
      <v-card
        class="app-dlg"
        :loading="loading"
      >
        <v-card-title class="app-dlg__head">
          <div class="app-dlg__titles">
            <h2 class="app-dlg__title">
              <slot name="title">
                {{ title }}
                <app-inline-help
                  v-if="helpTooltip"
                  bottom
                  small
                  :tooltip="helpTooltip"
                />
              </slot>
            </h2>
            <p
              v-if="subTitle || hasSubTitleSlot"
              class="app-dlg__sub"
            >
              <slot name="sub-title">
                {{ subTitle }}
              </slot>
            </p>
          </div>

          <slot name="menu" />

          <button
            type="button"
            class="m3-dlg__close"
            aria-label="Close"
            :disabled="closeButtonDisabled"
            data-tid="app-dialog-close"
            @click="open = false"
          >
            <frame-icon name="x" />
          </button>
        </v-card-title>

        <slot />

        <v-card-actions
          v-if="!noActions"
          class="app-dlg__actions"
        >
          <slot name="actions">
            <v-spacer />
            <button
              type="button"
              class="cbtn cbtn--ghost"
              :disabled="cancelButtonLoading"
              data-tid="app-dialog-cancel"
              @click="handleCancel"
            >
              {{ cancelButtonText || $t('app.general.btn.cancel') }}
            </button>
            <button
              type="submit"
              class="cbtn cbtn--primary"
              :disabled="saveButtonDisabled || saveButtonLoading"
              data-tid="app-dialog-save"
            >
              <v-progress-circular
                v-if="saveButtonLoading"
                indeterminate
                size="16"
                width="2"
              />
              {{ saveButtonText || $t('app.general.btn.save') }}
            </button>
          </slot>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>
</template>

<script lang="ts">
import BrowserMixin from '@/mixins/browser'
import type { VForm } from '@/types'
import { Component, Prop, VModel, Ref, PropSync, Mixins } from 'vue-property-decorator'

/**
 * Fluidd's form dialog (a title, ✕, what's inside, Cancel and Save), drawn
 * as the redesign's dialogs are (M3Dialog): the title large over the page's
 * surface, no rules between the parts, round buttons. Every dialog built on
 * it (renaming a file, a new folder, the printer's settings) follows.
 */
@Component({})
export default class AppDialog extends Mixins(BrowserMixin) {
  @VModel({ type: Boolean })
    open?: boolean

  @Prop({ type: Boolean })
  readonly disabled?: boolean

  @Prop({ type: String })
  readonly title?: string

  @Prop({ type: String })
  readonly helpTooltip?: string

  @Prop({ type: String })
  readonly subTitle?: string

  @Prop({ type: Boolean })
  readonly closeButtonDisabled?: boolean

  @Prop({ type: String })
  readonly cancelButtonText?: string

  @Prop({ type: Boolean })
  readonly cancelButtonLoading?: boolean

  @Prop({ type: String })
  readonly saveButtonText?: string

  @Prop({ type: Boolean })
  readonly saveButtonDisabled?: boolean

  @Prop({ type: Boolean })
  readonly saveButtonLoading?: boolean

  @Prop({ type: Boolean, default: true })
  readonly scrollable?: boolean

  @Prop({ type: Boolean })
  readonly noActions?: boolean

  @Prop({ type: [Boolean, String] })
  readonly loading?: boolean | string

  /** Kept for callers that pass it: the redesign's header has no rule to cast a shadow. */
  @Prop({ type: Boolean })
  readonly titleShadow?: boolean

  @PropSync('valid', { type: Boolean })
    validModel?: boolean

  @Ref('form')
  readonly form!: VForm

  get hasSubTitleSlot () {
    return !!this.$slots['sub-title'] || !!this.$scopedSlots['sub-title']
  }

  validate () {
    return this.form.validate()
  }

  handleCancel () {
    if (this.$listeners.cancel) {
      this.$emit('cancel')
    } else {
      this.open = false
    }
  }

  handleSave () {
    if (this.validate()) {
      this.$emit('save')
    }
  }
}
</script>
