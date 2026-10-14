<template>
  <div
    class="job"
    :class="{ 'job--printing': job.printing, 'job--row': row }"
    role="button"
    tabindex="0"
    :data-tid="`job-${job.key}`"
    @click="$emit('open')"
    @keydown.enter.self="$emit('open')"
  >
    <div class="job__picture">
      <img
        v-if="job.thumbnail"
        :src="job.thumbnail"
        alt=""
        loading="lazy"
      >
      <frame-icon
        v-else
        name="jobs"
        large
        class="job__no-picture"
      />
      <span
        v-if="job.printing && !row"
        class="job__badge job__badge--printing"
      >printing</span>
    </div>
    <div class="job__text">
      <span class="job__title">{{ job.title }}</span>
      <span class="job__facts">
        {{ job.facts || job.filename }}
        <span
          v-if="job.printed && !job.printing"
          class="job__printed"
        > · printed</span>
        <span
          v-if="job.printing && row"
          class="job__printed job__printed--now"
        > · printing</span>
      </span>
    </div>
    <div class="job__actions">
      <button
        type="button"
        class="job__btn job__btn--primary"
        :disabled="!canPrint"
        :title="printTitle"
        :data-tid="`job-print-${job.key}`"
        @click.stop="$emit('print')"
      >
        {{ busy ? 'Queue' : 'Print' }}
      </button>
      <button
        v-if="!row"
        type="button"
        class="job__btn"
        :data-tid="`job-preview-${job.key}`"
        @click.stop="$emit('open')"
      >
        Preview
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { JobFile } from '@/mixins/jobs'

/**
 * A G-code file on the printer: its picture, its name for people, how
 * long and how much, and whether it has printed. Print (or Queue, while
 * busy) and Preview show on hover, and on a touch screen always.
 */
@Component({})
export default class JobCard extends Vue {
  @Prop({ type: Object, required: true })
  readonly job!: JobFile

  @Prop({ type: Boolean })
  readonly row?: boolean

  @Prop({ type: Boolean })
  readonly busy?: boolean

  @Prop({ type: Boolean, default: true })
  readonly canPrint!: boolean

  get printTitle (): string {
    if (!this.canPrint) return this.busy ? 'The printer is busy and has no queue' : 'Klipper is not ready'
    return this.busy ? 'Add to the queue: it starts when this print is done' : 'Print now'
  }
}
</script>

<style lang="scss" scoped>
  .job {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 8px;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
    cursor: pointer;
    transition: box-shadow var(--m3d-duration-fast) var(--m3d-ease);

    &:hover,
    &:focus-visible {
      box-shadow: inset 0 0 0 1.5px var(--m3d-accent);
      outline: none;
    }
  }

  .job--printing {
    box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--m3d-accent) 40%, transparent);
  }

  .job__picture {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1.15;
    overflow: hidden;
    border-radius: 16px;
    background: radial-gradient(100% 100% at 50% 35%, #2f3133 0%, #1f2022 70%);

    img {
      width: 82%;
      height: 82%;
      object-fit: contain;
    }
  }

  .job__no-picture {
    color: var(--m3d-text-subtle);
  }

  .job__badge {
    position: absolute;
    top: 10px;
    left: 10px;
    padding: 3px 10px;
    border-radius: 999px;
    background: rgb(0 0 0 / 60%);
    color: var(--m3d-text);
    font-size: 11px;
    font-weight: 600;
  }

  .job__badge--printing {
    background: var(--m3d-accent-soft);
    color: var(--m3d-accent);
  }

  .job__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    padding: 12px 8px 8px;
  }

  .job__title {
    overflow: hidden;
    font-size: 15px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .job__facts {
    overflow: hidden;
    color: var(--m3d-text-muted);
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .job__printed {
    color: var(--m3d-success);
  }

  .job__printed--now {
    color: var(--m3d-accent);
  }

  .job__actions {
    display: flex;
    gap: 8px;
    padding: 0 8px 8px;
    opacity: 0;
    transition: opacity var(--m3d-duration-fast) var(--m3d-ease);
  }

  .job:hover .job__actions,
  .job:focus-within .job__actions {
    opacity: 1;
  }

  @media (hover: none) {
    .job__actions {
      opacity: 1;
    }
  }

  .job__btn {
    height: 32px;
    padding: 0 14px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-size: 13px;
    font-weight: 600;

    &:disabled {
      opacity: 0.45;
      cursor: default;
    }
  }

  .job__btn--primary {
    background: var(--m3d-accent);
    color: var(--m3d-on-accent, #00201e);
  }

  // A row: the list view, and a phone.
  .job--row {
    flex-direction: row;
    align-items: center;
    gap: 12px;
    padding: 8px 12px 8px 8px;
    border-radius: 0;
    background: transparent;

    .job__picture {
      flex: none;
      width: 56px;
      height: 56px;
      aspect-ratio: auto;
      border-radius: 12px;
    }

    .job__text {
      flex: 1 1 0;
      padding: 0;
    }

    .job__actions {
      padding: 0;
      opacity: 1;
    }
  }
</style>
