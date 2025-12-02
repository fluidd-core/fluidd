<template>
  <v-dialog
    v-model="open"
    :scrollable="scrollable"
    :persistent="persistent"
    :fullscreen="isMobileViewport"
    :transition="isMobileViewport ? 'dialog-bottom-transition' : undefined"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <v-form
      ref="form"
      v-model="validModel"
      :disabled="disabled"
      @submit.prevent="handleSave"
    >
      <v-card
        :loading="loading"
        :class="{
          'collapsable-card': titleShadow
        }"
      >
        <v-card-title
          class="card-heading py-2"
          :class="{
            'collapsable-card-title': titleShadow
          }"
        >
          <v-row no-gutters>
            <v-col align-self="center">
              <v-icon
                v-if="icon"
                left
              >
                {{ icon }}
              </v-icon>
              <slot name="title">
                <span class="focus--text">{{ title }}</span>
                <app-inline-help
                  v-if="helpTooltip"
                  bottom
                  small
                  :tooltip="helpTooltip"
                />
              </slot>
            </v-col>

            <v-col
              cols="auto"
              align-self="center"
            >
              <slot name="menu" />
            </v-col>

            <v-col
              v-if="!persistent"
              cols="auto"
              align-self="center"
            >
              <v-btn
                v-if="helpIcon != null && helpText != null && helpHref != null"
                text
                tile
                :href="helpHref"
                target="_blank"
              >
                <v-icon left>
                  {{ helpIcon }}
                </v-icon>
                {{ helpText }}
              </v-btn>

              <app-btn
                icon
                :disabled="closeButtonDisabled"
                @click="open = false"
              >
                <v-icon dense>
                  $close
                </v-icon>
              </app-btn>
            </v-col>
          </v-row>
        </v-card-title>

        <v-card-subtitle
          v-if="subTitle || hasSubTitleSlot"
          class="card-heading pb-2 secondary--text"
        >
          <slot name="sub-title">
            {{ subTitle }}
          </slot>
        </v-card-subtitle>

        <v-divider />

        <slot />

        <template v-if="!noActions">
          <v-divider />

          <v-card-actions>
            <slot name="actions">
              <v-spacer />
              <app-btn
                color="warning"
                text
                type="button"
                :loading="cancelButtonLoading"
                @click="handleCancel"
              >
                {{ cancelButtonText || $t('app.general.btn.cancel') }}
              </app-btn>
              <app-btn
                color="primary"
                type="submit"
                :loading="saveButtonLoading"
                :disabled="saveButtonDisabled"
              >
                {{ saveButtonText || $t('app.general.btn.save') }}
              </app-btn>
            </slot>
          </v-card-actions>
        </template>
      </v-card>
    </v-form>
  </v-dialog>
</template>

<script lang="ts">
import BrowserMixin from '@/mixins/browser'
import type { VForm } from 'vuetify/lib'
import { Component, Prop, VModel, Ref, PropSync, Mixins } from 'vue-property-decorator'

@Component({
  inheritAttrs: false
})
export default class AppDialog extends Mixins(BrowserMixin) {
  @VModel({ type: Boolean })
  open?: boolean

  @Prop({ type: Boolean })
  readonly disabled?: boolean

  @Prop({ type: String })
  readonly title?: string

  @Prop({ type: String })
  readonly icon?: string

  @Prop({ type: String })
  readonly helpTooltip?: string

  @Prop({ type: String })
  readonly helpIcon?: string

  @Prop({ type: String })
  readonly helpText?: string

  @Prop({ type: String })
  readonly helpHref?: string

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
  readonly persistent?: boolean

  @Prop({ type: Boolean })
  readonly noActions?: boolean

  @Prop({ type: [Boolean, String] })
  readonly loading?: boolean | string

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
