<template>
  <section
    class="ov-card ov-something"
    data-tid="overview-print-something"
  >
    <div class="ov-card__head">
      <h2 class="ov-card__title">
        Print something
      </h2>
      <router-link
        class="ov-card__link"
        :to="pagePath('/jobs')"
      >
        All jobs
      </router-link>
    </div>
    <div
      v-if="recentJobs.length"
      class="ov-something__jobs"
    >
      <div
        v-for="(job, i) in recentJobs"
        :key="job.filename"
        class="ov-something__job"
      >
        <span class="ov-something__thumb">
          <img
            v-if="job.thumbnail"
            :src="job.thumbnail"
            alt=""
          >
          <frame-icon
            v-else
            name="jobs"
          />
        </span>
        <span class="ov-something__text">
          <b>{{ job.name }}</b>
          <span>{{ job.facts }}</span>
        </span>
        <button
          type="button"
          class="ov-something__print"
          :class="{ 'ov-something__print--first': i === 0 }"
          :disabled="!klippyReady || busy"
          :data-tid="`print-again-${i}`"
          @click="printAgain(job.filename)"
        >
          Print
        </button>
      </div>
    </div>
    <p
      v-else
      class="ov-something__none"
    >
      Nothing printed yet. Your jobs appear here to print again.
    </p>
    <div
      v-if="!isMobileViewport"
      class="ov-something__drop"
    >
      <frame-icon
        name="upload"
        small
      />
      Drop a file anywhere. G-code prints; a model opens in Slice.
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import BrowserMixin from '@/mixins/browser'

/** Ready to print: the last few jobs, to print again in one press. */
@Component({})
export default class OverviewPrintSomething extends Mixins(OverviewMixin, BrowserMixin) {}
</script>

<style lang="scss" scoped>
  .ov-something__jobs > * + * {
    border-top: 1px solid var(--m3d-border);
  }

  .ov-something__job {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 0;
  }

  .ov-something__thumb {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    overflow: hidden;
    border-radius: 14px;
    background: radial-gradient(100% 100% at 50% 35%, #2f3133 0%, #1f2022 70%);
    color: var(--m3d-text-subtle);

    img {
      width: 88%;
      height: 88%;
      object-fit: contain;
    }
  }

  .ov-something__text {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    min-width: 0;

    b {
      overflow: hidden;
      font-size: 15px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .ov-something__print {
    flex: none;
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

  .ov-something__print--first {
    background: var(--m3d-accent);
    color: var(--m3d-on-accent, #00201e);
  }

  .ov-something__none {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .ov-something__drop {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: auto;
    padding: 14px 16px;
    border: 1.5px dashed var(--m3d-border-strong);
    border-radius: 14px;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }
</style>
