<template>
  <div
    class="now"
    :class="[`now--${variant}`, { 'now--paused': paused, 'now--no-part': !thumbnail }]"
    :data-tid="`printing-now-${tile.key}`"
  >
    <printer-stage
      state="printing"
      class="now__stage"
      :height="variant === 'card' ? 300 : undefined"
    >
      <div
        v-if="thumbnail && variant === 'card'"
        class="now__part-small"
      >
        <img
          :src="thumbnail"
          alt=""
        >
      </div>
    </printer-stage>

    <div class="now__body">
      <div class="now__who">
        <span class="now__name">{{ tile.name }}</span>
        <span class="now__where">
          <frame-icon
            v-if="tile.remote"
            name="cloud"
            small
          />
          {{ where }}
        </span>
      </div>

      <div
        v-if="file"
        class="now__file"
      >
        {{ file }}
      </div>

      <div class="now__numbers">
        <span class="now__percent">{{ percentText }}</span>
        <span
          v-if="leftText"
          class="now__figure"
        >
          <span class="now__figure-main">{{ leftText }}</span>
          <span
            v-if="variant === 'wide' && doneAt"
            class="now__figure-sub"
          >done about {{ doneAt }}</span>
          <span
            v-else-if="doneAt"
            class="now__figure-sub"
          >{{ doneAt }}</span>
        </span>
        <span
          v-if="variant === 'wide' && job && job.layer != null && job.layers"
          class="now__figure"
        >
          <span class="now__figure-main">{{ job.layer }} / {{ job.layers }}</span>
          <span class="now__figure-sub">layer</span>
        </span>
      </div>
      <div class="now__bar">
        <i :style="{ width: `${job && job.progress != null ? job.progress : 0}%` }" />
      </div>

      <div
        v-if="variant === 'wide' && chips.length"
        class="now__chips"
      >
        <span
          v-for="chip in chips"
          :key="chip"
          class="now__chip"
        >{{ chip }}</span>
      </div>

      <div class="now__actions">
        <button
          type="button"
          class="now__btn now__btn--primary"
          data-tid="printing-now-open"
          @click="$emit('open')"
        >
          {{ variant === 'wide' ? `Open ${tile.name}` : 'Open' }}
        </button>
        <template v-if="controllable">
          <button
            type="button"
            class="now__btn"
            :class="{ 'now__btn--square': variant === 'card' }"
            :aria-label="paused ? 'Resume' : 'Pause'"
            :title="paused ? 'Resume' : 'Pause'"
            data-tid="printing-now-pause"
            @click="$emit(paused ? 'resume' : 'pause')"
          >
            <v-icon small>
              {{ paused ? '$resume' : '$pause' }}
            </v-icon>
            <template v-if="variant === 'wide'">
              {{ paused ? 'Resume' : 'Pause' }}
            </template>
          </button>
          <button
            type="button"
            class="now__btn now__btn--danger"
            :class="{ 'now__btn--square': variant === 'card' }"
            aria-label="Stop print"
            title="Stop print"
            data-tid="printing-now-stop"
            @click="$emit('stop')"
          >
            <v-icon small>
              $cancel
            </v-icon>
            <template v-if="variant === 'wide'">
              Stop print
            </template>
          </button>
        </template>
      </div>
    </div>

    <div
      v-if="thumbnail && variant === 'wide'"
      class="now__part"
    >
      <img
        :src="thumbnail"
        alt=""
      >
      <span class="now__part-label">The part</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { PrinterTile, TileJob } from '@/services/printers-page/model'
import { shortDuration } from '@/util/short-duration'
import PrinterStage from './PrinterStage.vue'

/**
 * A printer printing now: wide when it is the only one, side by side when
 * several are. Pause and Stop are offered for the printer Fluidd is on,
 * whose controls this page holds; any other opens first.
 */
@Component({ components: { PrinterStage } })
export default class PrintingNowCard extends Vue {
  @Prop({ type: Object, required: true })
  readonly tile!: PrinterTile

  @Prop({ type: String, default: 'card' })
  readonly variant!: 'wide' | 'card'

  /** The part's picture from its G-code, when this browser can read it. */
  @Prop({ type: String, default: null })
  readonly thumbnail!: string | null

  @Prop({ type: Boolean })
  readonly controllable?: boolean

  get job (): TileJob | null {
    return this.tile.job
  }

  get paused (): boolean {
    return this.tile.state === 'paused'
  }

  get file (): string | null {
    return this.job?.file ? this.tile.detail : null
  }

  get where (): string {
    const route = this.tile.remote ? 'remote' : 'on this network'
    return this.tile.groupName ? `${this.tile.groupName} · ${route}` : route
  }

  get percentText (): string {
    if (this.paused) return 'Paused'
    return this.job?.progress != null ? `${this.job.progress}%` : 'Printing'
  }

  get leftText (): string | null {
    const left = this.job?.secondsLeft
    return left != null && left > 0 ? `${shortDuration(left)} left` : null
  }

  get doneAt (): string | null {
    const left = this.job?.secondsLeft
    if (left == null || left <= 0) return null
    const at = new Date(Date.now() + left * 1000)
    return `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`
  }

  get chips (): string[] {
    const chips: string[] = []
    if (this.job?.nozzle != null) chips.push(`Nozzle ${this.job.nozzle}°`)
    if (this.job?.bed != null) chips.push(`Bed ${this.job.bed}°`)
    return chips
  }
}
</script>

<style lang="scss" scoped>
  .now {
    display: grid;
    min-width: 0;
    overflow: hidden;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
  }

  .now--wide {
    grid-template-columns: minmax(240px, 360px) minmax(0, 1fr) minmax(200px, 340px);
    min-height: 400px;

    .now__stage {
      margin: 10px;
    }

    .now__body {
      gap: 18px;
      padding: 28px 28px 24px 18px;
    }

    .now__file {
      font-size: 34px;
      line-height: 1.08;
    }

    .now__percent {
      font-size: 56px;
      line-height: 1;
      letter-spacing: -0.02em;
    }

    .now__bar {
      height: 8px;
    }
  }

  .now--wide.now--no-part {
    grid-template-columns: minmax(240px, 360px) minmax(0, 1fr);
  }

  .now--card {
    display: flex;
    flex-direction: column;

    .now__stage {
      margin: 10px 10px 0;
    }

    .now__body {
      gap: 10px;
      padding: 14px 18px 18px;
    }

    .now__who {
      justify-content: space-between;
    }

    .now__name {
      font-size: 17px;
    }

    .now__file {
      font-size: 15px;
      font-weight: 500;
    }

    .now__numbers {
      justify-content: space-between;
    }

    .now__percent {
      font-size: 20px;
    }

    .now__figure {
      flex-direction: row;
      gap: 6px;
      align-items: baseline;
    }

    .now__figure-main,
    .now__figure-sub {
      font-size: 14px;
      font-weight: 400;
      color: var(--m3d-text-muted);
    }

    .now__actions {
      margin-top: 4px;
    }

    .now__btn--primary {
      flex: 1 1 auto;
    }
  }

  .now__body {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .now__who {
    display: flex;
    align-items: baseline;
    gap: 10px;
    min-width: 0;
  }

  .now__name {
    font-size: 15px;
    font-weight: 600;
    white-space: nowrap;
  }

  .now__where {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    overflow: hidden;
    color: var(--m3d-text-subtle);
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .now__file {
    overflow: hidden;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .now__numbers {
    display: flex;
    align-items: baseline;
    gap: 24px;
    font-variant-numeric: tabular-nums;
  }

  .now__percent {
    color: var(--m3d-accent);
    font-weight: 700;
  }

  .now--paused .now__percent {
    color: var(--m3d-warning);
  }

  .now__figure {
    display: flex;
    flex-direction: column;
  }

  .now__figure-main {
    font-size: 20px;
    font-weight: 600;
  }

  .now__figure-sub {
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .now__bar {
    height: 6px;
    overflow: hidden;
    border-radius: 3px;
    background: var(--m3d-surface-2);

    i {
      display: block;
      height: 100%;
      border-radius: 3px;
      background: var(--m3d-accent);
      transition: width var(--m3d-duration-base) var(--m3d-ease);
    }
  }

  .now--paused .now__bar i {
    background: var(--m3d-warning);
  }

  .now__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .now__chip {
    display: inline-flex;
    align-items: center;
    height: 30px;
    padding: 0 12px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }

  .now__actions {
    display: flex;
    gap: 8px;
    margin-top: auto;
  }

  .now__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 40px;
    padding: 0 16px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;

    .v-icon {
      color: inherit !important;
    }

    &:hover {
      filter: brightness(1.12);
    }
  }

  .now__btn--primary {
    background: var(--m3d-accent);
    color: var(--m3d-on-accent, #00201e);
  }

  .now__btn--danger {
    background: color-mix(in srgb, var(--m3d-danger) 16%, transparent);
    color: var(--m3d-danger);
  }

  .now__btn--square {
    width: 40px;
    padding: 0;
  }

  .now__part {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 10px 10px 10px 0;
    border-radius: 18px;
    background: radial-gradient(90% 80% at 50% 45%, #1d2a2a 0%, #121516 70%);

    img {
      width: 72%;
      height: 72%;
      object-fit: contain;
    }
  }

  .now__part-label {
    position: absolute;
    top: 14px;
    left: 16px;
    color: var(--m3d-text-muted);
    font-family: var(--m3d-font-mono);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .now__part-small {
    position: absolute;
    right: 12px;
    bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 96px;
    height: 96px;
    border-radius: 14px;
    background: radial-gradient(90% 80% at 50% 45%, #1d2a2a 0%, #121516 75%);

    img {
      width: 86%;
      height: 86%;
      object-fit: contain;
    }
  }

  @media (max-width: 1100px) {
    .now--wide,
    .now--wide.now--no-part {
      grid-template-columns: minmax(200px, 300px) minmax(0, 1fr);

      .now__part {
        display: none;
      }

      .now__file {
        font-size: 26px;
      }

      .now__percent {
        font-size: 44px;
      }
    }
  }
</style>
