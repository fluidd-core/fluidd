<template>
  <div
    class="upd"
    :class="`upd--${tone}`"
    :data-tid="`updating-${stage}`"
    role="status"
    aria-live="polite"
  >
    <div class="upd__card">
      <div
        class="upd__dial"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 120 120"
          class="upd__ring"
        >
          <circle
            cx="60"
            cy="60"
            r="52"
            class="upd__track"
          />
          <circle
            cx="60"
            cy="60"
            r="52"
            class="upd__arc"
            :class="{ 'upd__arc--spin': spinning }"
            :stroke-dasharray="`${dash} 327`"
          />
        </svg>
        <span class="upd__middle">
          <frame-icon
            v-if="stage === 'updated'"
            name="check"
          />
          <frame-icon
            v-else-if="tone === 'bad'"
            name="alert"
          />
          <template v-else-if="percent !== null">{{ percent }}%</template>
          <frame-icon
            v-else
            name="refresh"
            class="upd__turning"
          />
        </span>
      </div>

      <h1 class="upd__title">
        {{ headline.title }}
      </h1>
      <p class="upd__text">
        {{ headline.text }}
      </p>
      <p
        v-if="errorText"
        class="upd__error"
      >
        {{ errorText }}
      </p>

      <ol class="upd__steps">
        <li
          v-for="s in steps"
          :key="s.id"
          :class="`upd__step--${s.state}`"
        >
          <span class="upd__dot" />
          {{ s.label }}
        </li>
      </ol>

      <p
        v-if="fromText || toText"
        class="upd__versions"
      >
        <span v-if="fromText">{{ fromText }}</span>
        <frame-icon
          v-if="fromText && toText"
          name="chevronRight"
          small
        />
        <b v-if="toText">{{ toText }}</b>
      </p>

      <div class="upd__actions">
        <button
          v-if="stage === 'updated'"
          type="button"
          class="cbtn cbtn--primary"
          data-tid="updating-reload"
          @click="reload"
        >
          Reload
        </button>
        <button
          v-if="tone === 'bad' || stage === 'updated'"
          type="button"
          class="cbtn"
          @click="done"
        >
          Back to {{ printerName }}
        </button>
        <span
          v-if="offline"
          class="upd__waiting"
        >Waiting for {{ printerName }}…</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { updateHeadline, updateSteps, versionLabel, type SessionPhase, type UpdateStep } from '@/services/updates/model'
import { currentOutcome, forgetInstall, updateWatch } from '@/services/updates/watch'

type Stage = SessionPhase | 'offline' | 'late'

/**
 * The printer updating, from the press to the outcome: the new version
 * being written (with its progress), the restart (while the printer can't
 * answer, with no progress to show), the check that it works, and how it
 * ended. The connection screens show it while the printer restarts; it is
 * also the page an install opens.
 */
@Component({})
export default class UpdatingScreen extends Vue {
  /** Shown because the printer can't be reached: 'updating', or 'updating-late' past its budget. */
  @Prop({ type: String, default: null })
  readonly offlineState!: 'updating' | 'updating-late' | null

  @Prop({ type: String, default: 'the printer' })
  readonly printerName!: string

  get remembered () {
    return updateWatch.remembered
  }

  get offline (): boolean {
    return !!this.offlineState
  }

  get stage (): Stage {
    if (this.offlineState === 'updating-late') return 'late'
    if (this.offlineState === 'updating') return 'offline'
    return currentOutcome() ?? this.remembered?.phase ?? 'idle'
  }

  get tone (): 'busy' | 'good' | 'bad' | 'late' {
    if (this.stage === 'updated') return 'good'
    if (this.stage === 'rolled_back' || this.stage === 'failed') return 'bad'
    if (this.stage === 'late') return 'late'
    return 'busy'
  }

  get percent (): number | null {
    const p = this.stage === 'installing' ? this.remembered?.progress ?? updateWatch.status?.progress ?? null : null
    return typeof p === 'number' ? Math.max(0, Math.min(100, Math.round(p))) : null
  }

  get spinning (): boolean {
    return this.tone === 'busy' && this.percent === null
  }

  /** The arc: the progress while writing, a turning quarter otherwise, a full ring at the end. */
  get dash (): number {
    if (this.tone === 'good' || this.tone === 'bad') return 327
    if (this.percent !== null) return 327 * this.percent / 100
    return 82
  }

  get headline () {
    return updateHeadline(this.stage, this.percent, this.remembered?.to ?? null)
  }

  get steps (): UpdateStep[] {
    return updateSteps(this.stage)
  }

  get errorText (): string {
    if (this.tone !== 'bad') return ''
    return updateWatch.status?.session?.error?.message ?? ''
  }

  get fromText (): string {
    const v = this.remembered?.from
    return v ? versionLabel(v).text : ''
  }

  get toText (): string {
    const v = this.remembered?.to
    return v ? versionLabel(v).text : ''
  }

  /** The printer serves the new version's Fluidd too: load it. */
  reload () {
    forgetInstall()
    window.location.reload()
  }

  done () {
    forgetInstall()
    this.$emit('done')
  }
}
</script>

<style lang="scss" scoped>
  .upd {
    display: flex;
    justify-content: center;
    padding: 40px 16px;
  }

  .upd__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: 100%;
    max-width: 520px;
    padding: 32px 28px;
    border-radius: 24px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
    text-align: center;
  }

  .upd__dial {
    position: relative;
    width: 132px;
    height: 132px;
    margin-bottom: 6px;
  }

  .upd__ring {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .upd__track {
    fill: none;
    stroke: var(--m3d-surface-2);
    stroke-width: 8;
  }

  .upd__arc {
    fill: none;
    stroke: var(--m3d-accent);
    stroke-linecap: round;
    stroke-width: 8;
    transition: stroke-dasharray 0.6s var(--m3d-ease, ease);
    transform-origin: 60px 60px;
  }

  .upd__arc--spin {
    animation: upd-spin 1.4s linear infinite;
  }

  .upd--good .upd__arc {
    stroke: var(--m3d-success, #57c08a);
  }

  .upd--bad .upd__arc {
    stroke: var(--m3d-danger, #e5534b);
  }

  .upd--late .upd__arc {
    stroke: var(--m3d-warning, #e8963c);
  }

  @keyframes upd-spin {
    to { transform: rotate(360deg); }
  }

  .upd__middle {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .upd__turning {
    animation: upd-spin 2.4s linear infinite;
    opacity: 0.6;
  }

  .upd__title {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
  }

  .upd__text {
    max-width: 420px;
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 15px;
  }

  .upd__error {
    margin: 0;
    color: var(--m3d-danger) !important;
    font-size: 14px;
  }

  .upd__steps {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    max-width: 320px;
    margin: 8px 0 0;
    padding: 14px 16px;
    border-radius: 16px;
    background: var(--m3d-surface-2);
    list-style: none;
    text-align: left;

    li {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--m3d-text-subtle);
      font-size: 14px;
    }
  }

  .upd__dot {
    flex: none;
    width: 10px;
    height: 10px;
    border: 2px solid var(--m3d-border-strong);
    border-radius: 50%;
  }

  .upd__step--done {
    color: var(--m3d-text-muted) !important;

    .upd__dot {
      border-color: var(--m3d-success, #57c08a);
      background: var(--m3d-success, #57c08a);
    }
  }

  .upd__step--now {
    color: var(--m3d-text) !important;
    font-weight: 600;

    .upd__dot {
      border-color: var(--m3d-accent);
      background: var(--m3d-accent);
      animation: upd-pulse 1.2s ease-in-out infinite;
    }
  }

  @keyframes upd-pulse {
    50% { opacity: 0.35; }
  }

  .upd__versions {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 4px 0 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .upd__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-top: 6px;
  }

  .upd__waiting {
    color: var(--m3d-text-subtle);
    font-size: 13px;
  }

  @media (prefers-reduced-motion: reduce) {
    .upd__arc--spin,
    .upd__turning,
    .upd__step--now .upd__dot {
      animation: none;
    }
  }
</style>
