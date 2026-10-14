<template>
  <m3-dialog
    ref="dialog"
    :value="open"
    :eyebrow="eyebrow"
    label-id="slicer-confirm-title"
    close-test="slicer-confirm-close"
    :close-label="$t('app.general.btn.close')"
    :focus-title="false"
    max-width="480"
    content-class="slicer-confirm"
    data-tid="slicer-confirm"
    @close="handleInput(false)"
  >
    <template #title>
      {{ title }}
    </template>

    <div class="m3-dlg__panel pcd__facts">
      <div class="pcd__fact">
        <span class="pcd__label">{{ $tc('app.slicer.confirm.file', fileCount) }}</span>
        <span class="pcd__value">
          <span
            class="pcd__file"
            data-test="slicer-confirm-file"
          >{{ firstFile }}</span>
          <span
            v-if="more"
            class="pcd__more"
            data-test="slicer-confirm-more"
          >{{ more }}</span>
        </span>
      </div>
      <div class="pcd__fact">
        <span class="pcd__label">{{ $t('app.slicer.confirm.printer') }}</span>
        <span
          class="pcd__value"
          data-test="slicer-confirm-printer"
        >{{ current ? current.printer : '' }}</span>
      </div>
      <div
        v-if="loaded"
        class="pcd__fact"
      >
        <span class="pcd__label">{{ $t('app.slicer.confirm.loaded') }}</span>
        <span
          class="pcd__value pcd__value--row"
          data-test="slicer-confirm-loaded"
        >
          <span
            class="pcd__swatch"
            :style="{ background: loaded.colour }"
          />
          {{ loaded.name }}
        </span>
      </div>
    </div>

    <plate-check
      v-if="asksPlateClear"
      v-model="plateClear"
      data-test="slicer-confirm-plate"
    />
    <p
      v-else-if="current && current.mode === 'start'"
      class="m3-dlg__note"
      data-test="slicer-confirm-plate-not-needed"
    >
      {{ $t('app.slicer.confirm.plate_not_needed') }}
    </p>

    <p class="m3-dlg__note">
      {{ $t('app.slicer.confirm.save_note') }}
    </p>

    <template #actions>
      <button
        type="button"
        class="cbtn"
        data-test="slicer-confirm-upload"
        @click="answer({ choice: 'upload-only' })"
      >
        {{ $t('app.slicer.confirm.upload_only') }}
      </button>
      <button
        type="button"
        class="cbtn cbtn--primary"
        data-test="slicer-confirm-print"
        :disabled="!armed || (asksPlateClear && !plateClear)"
        @click="answer({ choice: 'print', plateClear })"
      >
        {{ current && current.mode === 'queue' ? $t('app.slicer.confirm.queue') : $t('app.slicer.confirm.print') }}
      </button>
    </template>
  </m3-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import type { ConfirmAnswer } from '@/services/slicer-bridge/vendor/printer-client/bridge/host'
import type { PlateClearAsk, PrintMode } from '@/services/slicer-bridge/vendor/printer-client/bridge/protocol'
import { jobTitle } from '@/services/jobs/model'
import M3Dialog from '@/components/ui/M3Dialog.vue'
import PlateCheck from '@/components/ui/PlateCheck.vue'

/**
 * How long Print (or Queue) stays off after the dialog shows, and after this
 * window gets the focus back, as browsers do for their permission prompts.
 */
export const ARM_DELAY_MS = 500

/** What the dialog asks: the files the slicer uploaded, for the printer Fluidd has selected. */
export interface PrintConfirmRequest {
  printer: string;
  paths: string[];
  mode: PrintMode;
  plateClear: PlateClearAsk;
}

/** What the printer has loaded, when Fluidd knows: shown beside the file. */
export interface LoadedMaterial {
  name: string;
  colour: string;
}

/**
 * Fluidd's own check before a print the slicer in /slice asks for
 * (printer-bridge/1's print.request): the slicer never starts a print, the
 * person does, here. It shows which file ("then ‹n› more" for the plates
 * queued after it), on which printer, with what loaded, then the plate
 * check when the host decided it must be asked (never for a queue entry):
 * the M1 prints upside down onto its plate, so a part left there is a
 * crash, and Print now stays off until it is ticked. Save to the printer,
 * ✕, Esc and a click outside all answer Upload only: the files stay on the
 * printer and nothing starts.
 *
 * Focus starts on the title, never on Print, so a key held or pressed twice
 * where the slicer's button was cannot confirm the print. Print also stays
 * off for ARM_DELAY_MS after the dialog shows (each new request starts it
 * again) and after the window regains the focus, so a click meant for the
 * frame (the second of a double-click, a frame that asks at the moment of a
 * click) cannot land on it.
 */
@Component({ components: { M3Dialog, PlateCheck } })
export default class PrintConfirmDialog extends Vue {
  @Prop({ type: Object, default: null })
  readonly request!: PrintConfirmRequest | null

  @Prop({ type: Object, default: null })
  readonly loaded!: LoadedMaterial | null

  plateClear = false
  answered = false
  armed = false
  armTimer: ReturnType<typeof setTimeout> | null = null
  /** The last request, still drawn while the dialog closes after it has gone. */
  shown: PrintConfirmRequest | null = null

  get open (): boolean {
    return this.request !== null
  }

  /** The request drawn: this one, or while it closes, the last. */
  get current (): PrintConfirmRequest | null {
    return this.request ?? this.shown
  }

  get asksPlateClear (): boolean {
    return this.request?.mode === 'start' && this.request.plateClear === 'ask'
  }

  get fileCount (): number {
    return this.current?.paths.length ?? 1
  }

  get firstFile (): string {
    return this.current?.paths[0] ?? ''
  }

  get eyebrow (): string {
    if (!this.current) return ''
    return this.current.mode === 'queue'
      ? this.$t('app.slicer.confirm.eyebrow_queue').toString()
      : this.$t('app.slicer.confirm.eyebrow').toString()
  }

  get title (): string {
    const request = this.current
    if (!request) return ''
    const values = { file: jobTitle(request.paths[0] ?? ''), printer: request.printer }
    return request.mode === 'queue'
      ? this.$t('app.slicer.confirm.queue_title', values).toString()
      : this.$t('app.slicer.confirm.print_title', values).toString()
  }

  get more (): string {
    const request = this.current
    const n = request ? request.paths.length - 1 : 0
    if (!request || n < 1) return ''
    return request.mode === 'queue'
      ? this.$t('app.slicer.confirm.and_more', { n }).toString()
      : this.$t('app.slicer.confirm.and_queue_more', { n }).toString()
  }

  @Watch('request')
  onRequest (request: PrintConfirmRequest | null) {
    this.plateClear = false
    this.answered = false
    if (request) {
      this.shown = request
      this.arm()
      this.$nextTick(() => (this.$refs.dialog as M3Dialog | undefined)?.focus())
    } else {
      this.disarm()
    }
  }

  mounted () {
    window.addEventListener('blur', this.disarm)
    window.addEventListener('focus', this.handleFocus)
    if (this.request) this.onRequest(this.request)
  }

  beforeDestroy () {
    window.removeEventListener('blur', this.disarm)
    window.removeEventListener('focus', this.handleFocus)
    this.disarm()
  }

  /** Print turns on ARM_DELAY_MS from now (again, if it was on). */
  arm () {
    this.disarm()
    this.armTimer = setTimeout(() => {
      this.armTimer = null
      this.armed = true
    }, ARM_DELAY_MS)
  }

  disarm () {
    if (this.armTimer) clearTimeout(this.armTimer)
    this.armTimer = null
    this.armed = false
  }

  handleFocus () {
    if (this.request) this.arm()
  }

  /** The dialog closed itself (✕, Esc, a click outside): Upload only. */
  handleInput (value: boolean) {
    if (!value) this.answer({ choice: 'upload-only' })
  }

  answer (answer: ConfirmAnswer) {
    if (!this.request || this.answered) return
    if (answer.choice === 'print' && (!this.armed || (this.asksPlateClear && !answer.plateClear))) return
    this.answered = true
    this.$emit('answer', answer)
  }
}
</script>

<style lang="scss" scoped>
  .pcd__facts {
    gap: 0;
    padding-top: 4px;
    padding-bottom: 4px;
  }

  .pcd__fact {
    display: flex;
    align-items: baseline;
    gap: 16px;
    padding: 9px 0;

    & + & {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .pcd__label {
    flex: 0 0 64px;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .pcd__value {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    font-size: 14px;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .pcd__value--row {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  .pcd__file {
    font-family: var(--m3d-font-mono);
    font-size: 13px;
    font-weight: 500;
  }

  .pcd__more {
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-weight: 400;
  }

  .pcd__swatch {
    flex: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 20%);
  }
</style>
