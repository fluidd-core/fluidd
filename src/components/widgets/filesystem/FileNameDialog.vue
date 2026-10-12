<template>
  <m3-dialog
    :value="open"
    :title="title"
    :focus-title="false"
    max-width="420"
    data-tid="file-name-dialog"
    @close="open = false"
  >
    <form
      class="m3-field"
      autocomplete="off"
      @submit.prevent="handleSave"
    >
      <label
        class="m3-field__label"
        :for="inputId"
      >{{ label }}</label>
      <span class="m3-field__box">
        <input
          :id="inputId"
          ref="input"
          v-model="newName"
          type="text"
          spellcheck="false"
          autocapitalize="off"
          data-tid="file-name-input"
        >
      </span>
    </form>

    <template #actions>
      <button
        type="button"
        class="cbtn cbtn--ghost"
        data-tid="file-name-cancel"
        @click="open = false"
      >
        {{ $t('app.general.btn.cancel') }}
      </button>
      <button
        type="button"
        class="cbtn cbtn--primary"
        :disabled="!canSave"
        data-tid="file-name-save"
        @click="handleSave"
      >
        {{ $t('app.general.btn.save') }}
      </button>
    </template>
  </m3-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop, VModel } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import M3Dialog from '@/components/ui/M3Dialog.vue'

let named = 0

/**
 * A name for something new (a folder, a file, a mesh) or a new name for
 * something there: one box, Save turns on once it holds a name. The part
 * before the extension starts selected, so typing replaces just the name.
 */
@Component({ components: { M3Dialog } })
export default class FileNameDialog extends Mixins(StateMixin) {
  @VModel({ type: Boolean })
    open?: boolean

  @Prop({ type: String, required: true })
  readonly title!: string

  @Prop({ type: String, required: true })
  readonly label!: string

  @Prop({ type: String, required: true })
  readonly name!: string

  newName = ''
  inputId = `file-name-${++named}`

  get canSave (): boolean {
    return this.newName.trim().length > 0
  }

  mounted () {
    this.newName = this.name
    this.$nextTick(() => {
      const input = this.$refs.input as HTMLInputElement | undefined
      if (!input) return
      input.focus()
      const dot = this.newName.lastIndexOf('.')
      input.setSelectionRange(0, dot > 0 ? dot : this.newName.length)
    })
  }

  handleSave () {
    if (!this.canSave) return
    this.$emit('save', this.newName)
    this.open = false
  }
}
</script>
