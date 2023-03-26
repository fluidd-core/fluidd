<template>
  <v-dialog
    v-model="open"
    :scrollable="scrollable"
    v-bind="$attrs"
  >
    <v-form
      ref="form"
      v-model="validModel"
      :disabled="disabled"
      @submit.prevent="handleSave"
    >
      <v-card>
        <v-card-title class="card-heading py-2">
          <slot name="title">
            <span class="focus--text">{{ title }}</span>
          </slot>
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
import { VForm } from '@/types'
import { Component, Vue, Prop, VModel, Ref, PropSync } from 'vue-property-decorator'

@Component({})
export default class AppDialog extends Vue {
  @VModel({ type: Boolean, required: true })
    open!: boolean

  @Prop({ type: Boolean })
  readonly disabled?: boolean

  @Prop({ type: String })
  readonly title?: string

  @Prop({ type: String })
  readonly subTitle?: string

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
  readonly scrollable!: boolean

  @Prop({ type: Boolean })
  readonly noActions?: boolean

  @PropSync('valid', { type: Boolean })
  readonly validModel?: boolean

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
