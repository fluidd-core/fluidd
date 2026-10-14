<template>
  <control-card
    class="mmesh"
    title="The bed"
    data-tid="maintenance-mesh"
  >
    <template #aside>
      <span v-if="measuring">measuring</span>
      <span v-else-if="measuredWhen">measured {{ measuredWhen }}</span>
    </template>

    <div
      v-if="measuring"
      class="mmesh__bar"
      role="progressbar"
      :aria-valuenow="liveHeights.length"
      :aria-valuemax="total || undefined"
    >
      <span
        class="mmesh__fill"
        :class="{ 'mmesh__fill--unknown': !total || !liveHeights.length }"
        :style="{ width: total ? `${Math.round(100 * liveHeights.length / total)}%` : undefined }"
      />
    </div>

    <div
      v-if="grid.length"
      class="mmesh__body"
    >
      <div
        class="mmesh__grid"
        :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }"
        :aria-label="`Bed mesh, ${columns} × ${grid.length} points, back at the top`"
        role="img"
      >
        <i
          v-for="(cell, n) in cells"
          :key="n"
          class="mmesh__cell"
          :class="{ 'mmesh__cell--empty': cell === null, 'mmesh__cell--value': pro }"
          :style="cell === null ? undefined : { background: colorOf(cell) }"
          :title="cell === null ? undefined : `${cell.toFixed(3)} mm`"
        >{{ pro && cell !== null ? meshValue(cell) : '' }}</i>
      </div>

      <dl class="mmesh__facts">
        <template v-if="measuring">
          <dt>Points measured</dt>
          <dd>{{ measuredText }}</dd>
        </template>
        <template v-if="range !== null">
          <dt>{{ measuring ? 'Range so far' : 'Highest to lowest' }}</dt>
          <dd>{{ range.toFixed(2) }} mm</dd>
        </template>
        <p
          v-if="summary && !measuring"
          class="mmesh__verdict"
          :class="`mmesh__verdict--${summary.tone}`"
        >
          {{ summary.verdict }}
        </p>
      </dl>
    </div>

    <div
      v-else
      class="mmesh__none"
    >
      <frame-icon name="mesh" />
      <p v-if="measuring">
        Measuring the plate…
      </p>
      <p v-else>
        No measurement yet. Level the bed to measure the plate.
      </p>
    </div>

    <p
      v-if="grid.length"
      class="mmesh__legend"
    >
      <span><i class="mmesh__key mmesh__key--low" />lower</span>
      <span><i class="mmesh__key mmesh__key--level" />level</span>
      <span><i class="mmesh__key mmesh__key--high" />higher</span>
      <span class="mmesh__muted">· {{ columns }} × {{ grid.length }} points · back at the top</span>
    </p>

    <p class="mmesh__note">
      <template v-if="measuring">
        Keep the plate on and the nozzle clear while it measures.
      </template>
      <template v-else-if="mesh.length">
        {{ meshInUse ? 'In use: the printer follows this mesh as it moves.' : 'Not loaded now. The printer loads a mesh when it needs one.' }}
      </template>
    </p>

    <router-link
      v-if="pro && supportsBedMesh"
      :to="meshPageTo"
      class="cbtn mmesh__more"
    >
      Mesh profiles and 3D view
      <frame-icon
        name="chevronRight"
        small
      />
    </router-link>
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import MaintenanceMixin from '@/mixins/maintenance'
import ControlCard from '@/components/control/ControlCard.vue'
import { daysAgo, liveMesh, meshColor, meshValue } from '@/services/maintenance/model'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'

/**
 * The plate as last measured, as a grid coloured from low to high, with how
 * far apart its highest and lowest points are. While the bed is measured,
 * the grid fills in point by point from Klipper's probe lines.
 */
@Component({ components: { ControlCard } })
export default class MaintenanceMesh extends Mixins(MaintenanceMixin) {
  get meshPageTo (): string {
    return scopedPath('/tune', activeSlug())
  }

  get supportsBedMesh (): boolean {
    return this.$store.getters['mesh/getSupportsBedMesh'] as boolean
  }

  get columns (): number {
    return this.grid[0]?.length ?? 0
  }

  get total (): number {
    return this.meshSize ? this.meshSize[0] * this.meshSize[1] : 0
  }

  /** Rows front to back: the mesh being measured, else the last one. */
  /** "11 of 25", or just the count when the mesh's size isn't known. */
  get measuredText (): string {
    return this.total ? `${this.liveHeights.length} of ${this.total}` : `${this.liveHeights.length}`
  }

  get grid (): Array<Array<number | null>> {
    if (this.measuring && this.meshSize && this.liveHeights.length) {
      return liveMesh(this.liveHeights, this.meshSize[0], this.meshSize[1])
    }
    return this.measuring ? [] : this.mesh
  }

  /** The cells to draw, back row first, as you'd see the plate from the front. */
  get cells (): Array<number | null> {
    return [...this.grid].reverse().flat()
  }

  get values (): number[] {
    return this.grid.flat().filter((v): v is number => v !== null)
  }

  get range (): number | null {
    if (!this.values.length) return null
    return Math.max(...this.values) - Math.min(...this.values)
  }

  get summary () {
    return this.meshSummary
  }

  get measuredWhen (): string {
    const at = this.lastRun.bedMesh
    return at && this.mesh.length ? daysAgo(at, Date.now()) : ''
  }

  meshValue (value: number): string {
    return meshValue(value)
  }

  colorOf (value: number): string {
    return meshColor(value, Math.min(...this.values), Math.max(...this.values))
  }
}
</script>

<style lang="scss" scoped>
  .mmesh__bar {
    position: relative;
    height: 6px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--m3d-surface-2);
  }

  .mmesh__fill {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: inherit;
    background: var(--m3d-accent);
    transition: width var(--m3d-duration-base, 0.2s) var(--m3d-ease, ease);
  }

  .mmesh__fill--unknown {
    width: 30%;
    animation: mmesh-slide 1.4s ease-in-out infinite;
  }

  @keyframes mmesh-slide {
    from { transform: translateX(-100%); }
    to { transform: translateX(340%); }
  }

  .mmesh__body {
    display: flex;
    flex-wrap: wrap;
    gap: 16px 20px;
    align-items: flex-start;
  }

  .mmesh__grid {
    display: grid;
    flex: 1 1 220px;
    gap: 3px;
    max-width: 320px;
  }

  .mmesh__cell {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    border-radius: 4px;
    color: rgba(0, 0, 0, 0.72);
    font-size: 9px;
    font-style: normal;
    font-variant-numeric: tabular-nums;
  }

  .mmesh__cell--empty {
    background: var(--m3d-surface-2);
  }

  .mmesh__facts {
    display: flex;
    flex: 1 1 140px;
    flex-direction: column;
    gap: 4px;
    margin: 0;

    dt {
      color: var(--m3d-text-muted);
      font-size: 13px;
    }

    dd {
      margin: 0 0 8px;
      font-size: 22px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
  }

  .mmesh__verdict {
    margin: 0;
    font-size: 13px;
  }

  .mmesh__verdict--ok { color: var(--m3d-success); }
  .mmesh__verdict--warn { color: var(--m3d-warning); }
  .mmesh__verdict--err { color: var(--m3d-danger); }

  .mmesh__none {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 28px 12px;
    color: var(--m3d-text-muted);
    text-align: center;

    p {
      margin: 0;
      font-size: 14px;
    }
  }

  .mmesh__legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    margin: 0;
    font-size: 12px;

    span {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
  }

  .mmesh__key {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 3px;
  }

  .mmesh__key--low { background: rgb(59, 130, 246); }
  .mmesh__key--level { background: rgb(87, 192, 138); }
  .mmesh__key--high { background: rgb(232, 150, 60); }

  .mmesh__muted,
  .mmesh__note {
    color: var(--m3d-text-muted);
  }

  .mmesh__note {
    margin: 0;
    font-size: 13px;

    &:empty {
      display: none;
    }
  }

  .mmesh__more {
    align-self: flex-start;
  }
</style>
