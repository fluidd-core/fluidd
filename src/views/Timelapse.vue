<template>
  <div
    class="tl"
    :class="{ 'tl--phone': isMobileViewport }"
    data-tid="timelapse-page"
  >
    <section
      class="tl__videos"
      data-tid="timelapse-videos"
    >
      <div class="tl__head">
        <h2>Timelapses</h2>
        <span class="tl__sub">{{ items.length }} {{ items.length === 1 ? 'file' : 'files' }}</span>
      </div>
      <p
        v-if="!loaded"
        class="tl__note"
      >
        Reading the timelapse folder…
      </p>
      <p
        v-else-if="!items.length"
        class="tl__note"
      >
        No timelapses yet. Turn timelapse on, and each print's video lands here once it renders.
      </p>
      <div class="tl__grid">
        <article
          v-for="item in items"
          :key="item.name"
          class="tl__item"
          :data-file="item.name"
        >
          <button
            type="button"
            class="tl__picture"
            :aria-label="item.kind === 'video' ? `Play ${item.title}` : `Download ${item.title}`"
            @click="item.kind === 'video' ? play(item.name) : download(item.name)"
          >
            <img
              v-if="item.thumbnail"
              :src="url(item.thumbnail)"
              alt=""
              loading="lazy"
            >
            <frame-icon
              v-else
              :name="item.kind === 'video' ? 'camera2' : 'files'"
            />
            <span
              v-if="item.kind === 'video'"
              class="tl__play"
              aria-hidden="true"
            >▶</span>
          </button>
          <div class="tl__meta">
            <b :title="item.name">{{ item.title }}</b>
            <span>{{ item.kind === 'frames' ? 'saved frames · ' : '' }}{{ item.when || date(item.modified) }} · {{ size(item.size) }}</span>
          </div>
          <div class="tl__actions">
            <button
              type="button"
              class="tl__link"
              @click="download(item.name)"
            >
              Download
            </button>
            <button
              type="button"
              class="tl__link tl__link--danger"
              data-tid="timelapse-delete"
              @click="remove(item)"
            >
              Delete
            </button>
          </div>
        </article>
      </div>
    </section>

    <div class="tl__side">
      <control-card
        title="This print"
        data-tid="timelapse-status"
      >
        <template #aside>
          <span v-if="frameCount">{{ frameCount }} {{ frameCount === 1 ? 'frame' : 'frames' }}</span>
        </template>
        <div
          v-if="frameCount"
          class="tl__frame"
        >
          <img
            :src="frameUrl"
            alt=""
            :style="{ filter: rendering ? `saturate(${renderProgress}%)` : 'none' }"
          >
        </div>
        <camera-item
          v-else-if="camera"
          :camera="camera"
          class="tl__camera"
        />
        <p
          v-else
          class="tl__note"
        >
          No frames yet. With timelapse on, a picture is taken as each layer finishes.
        </p>
        <div
          v-if="frameCount > 1"
          class="tl__slider"
        >
          <span>Frame {{ shownFrame }} of {{ frameCount }}</span>
          <range-slider
            :value="shownFrame"
            :min="1"
            :max="frameCount"
            label="Frame"
            :value-text-formatter="frameValueText"
            :disabled="rendering"
            @change="pickFrame"
          />
        </div>
        <p
          v-if="renderLine"
          class="tl__render"
          data-tid="timelapse-rendering"
        >
          {{ renderLine }}
        </p>
        <div class="tl__buttons">
          <button
            type="button"
            class="cbtn cbtn--primary"
            :disabled="!frameCount || rendering"
            data-tid="timelapse-render"
            @click="openDialog(true)"
          >
            Render now
          </button>
          <button
            type="button"
            class="cbtn"
            :disabled="!frameCount || savingFrames"
            data-tid="timelapse-save-frames"
            @click="saveFrames"
          >
            Save the frames
          </button>
        </div>
      </control-card>

      <control-card
        title="Settings"
        data-tid="timelapse-settings"
      >
        <div class="tl__rows">
          <div class="crow">
            <span class="crow__name">
              Take a timelapse
              <span
                v-if="blocked('enabled')"
                class="crow__sub"
              >· set in moonraker.conf</span>
            </span>
            <toggle-switch
              :value="!!settings && settings.enabled"
              label="Take a timelapse"
              :disabled="blocked('enabled')"
              @input="set({ enabled: $event })"
            />
          </div>
          <div class="crow">
            <span class="crow__name">
              Render when the print ends
              <span
                v-if="blocked('autorender')"
                class="crow__sub"
              >· set in moonraker.conf</span>
            </span>
            <toggle-switch
              :value="!!settings && settings.autorender"
              label="Render when the print ends"
              :disabled="blocked('autorender')"
              @input="set({ autorender: $event })"
            />
          </div>
        </div>
        <button
          type="button"
          class="cbtn"
          data-tid="timelapse-more-settings"
          @click="openDialog(false)"
        >
          Camera, mode and rendering…
        </button>
      </control-card>
    </div>

    <timelapse-render-settings-dialog
      v-if="dialogOpen"
      v-model="dialogOpen"
      :renderable="dialogRenders"
    />
    <v-dialog
      :value="!!playing"
      max-width="960"
      @input="!$event && (playing = null)"
    >
      <div
        v-if="playing"
        class="tl__player"
        data-tid="timelapse-player"
      >
        <video
          :src="playing"
          controls
          autoplay
          playsinline
        />
      </div>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import FilesMixin from '@/mixins/files'
import BrowserMixin from '@/mixins/browser'
import { SocketActions } from '@/api/socketActions'
import type { AppFile, FileBrowserEntry } from '@/store/files/types'
import type { RenderStatus, TimelapseLastFrame, TimelapseSettings, TimelapseWritableSettings } from '@/store/timelapse/types'
import type { WebcamConfig } from '@/store/webcams/types'
import { fileSize, shortDate } from '@/services/jobs/model'
import { frameFile, renderText, timelapseItems, type TimelapseItem } from '@/services/timelapse/model'
import ControlCard from '@/components/control/ControlCard.vue'
import RangeSlider from '@/components/control/RangeSlider.vue'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import CameraItem from '@/components/widgets/camera/CameraItem.vue'
import TimelapseRenderSettingsDialog from '@/components/widgets/timelapse/TimelapseRenderSettingsDialog.vue'

/**
 * Timelapse (Jobs, with moonraker-timelapse): the videos made so far, to
 * play, download or delete; this print's frames, to look through, render
 * or save; and the two settings people change, with the camera, mode and
 * rendering in Fluidd's own settings dialog.
 */
@Component({ components: { ControlCard, RangeSlider, ToggleSwitch, CameraItem, TimelapseRenderSettingsDialog } })
export default class Timelapse extends Mixins(StateMixin, FilesMixin, BrowserMixin) {
  picked = 0
  dialogOpen = false
  dialogRenders = false
  playing: string | null = null

  frameValueText (value: number): string {
    return `Frame ${value} of ${this.frameCount}`
  }

  mounted () {
    SocketActions.serverFilesGetDirectory('timelapse', 'timelapse')
  }

  // -- the folder -------------------------------------------------------------------

  get loaded (): boolean {
    return !!this.$store.getters['files/getDirectory']('timelapse')
  }

  get items (): TimelapseItem[] {
    const entries = (this.$store.getters['files/getDirectory']('timelapse') as FileBrowserEntry[] | undefined) ?? []
    return timelapseItems(entries.filter((e): e is AppFile => e.type === 'file'))
  }

  url (name: string): string {
    return this.createFileUrl(name, 'timelapse')
  }

  size (bytes: number): string {
    return fileSize(bytes)
  }

  date (seconds: number): string {
    return shortDate(seconds)
  }

  async play (name: string) {
    this.playing = await this.createFileUrlWithToken(name, 'timelapse')
  }

  download (name: string) {
    this.downloadFile(name, 'timelapse')
  }

  async remove (item: TimelapseItem) {
    const ok = await this.$confirm("The video goes from the printer. This can't be undone.", { title: `Delete ${item.title}${item.when ? ` (${item.when})` : ''}?`, buttonTrueText: 'Delete', danger: true })
    if (!ok) return
    SocketActions.serverFilesDeleteFile(`timelapse/${item.name}`)
    // The picture saved beside a video goes with it, as Fluidd's file browser does.
    if (item.thumbnail) SocketActions.serverFilesDeleteFile(`timelapse/${item.thumbnail}`)
  }

  // -- this print -------------------------------------------------------------------

  get settings (): TimelapseSettings | undefined {
    return this.$store.getters['timelapse/getSettings']
  }

  get lastFrame (): TimelapseLastFrame | undefined {
    return this.$store.getters['timelapse/getLastFrame']
  }

  get frameCount (): number {
    return this.lastFrame?.uniqueCount ?? 0
  }

  get shownFrame (): number {
    return this.picked || this.frameCount
  }

  pickFrame (n: number) {
    this.picked = n === this.frameCount ? 0 : n
  }

  get frameUrl (): string {
    const last = this.lastFrame?.file ?? ''
    return this.createFileUrl(this.picked ? frameFile(this.picked, last) : last, 'timelapse_frames')
  }

  get camera (): WebcamConfig | undefined {
    return this.settings ? this.$store.getters['webcams/getWebcamById'](this.settings.camera) as WebcamConfig | undefined : undefined
  }

  get renderStatus (): RenderStatus | undefined {
    return this.$store.getters['timelapse/getRenderStatus']
  }

  get rendering (): boolean {
    return !!this.renderStatus && this.renderStatus.status !== 'success'
  }

  get renderProgress (): number {
    return this.renderStatus?.status === 'running' ? this.renderStatus.progress : 0
  }

  get renderLine (): string | null {
    return renderText(this.renderStatus as never)
  }

  get savingFrames (): boolean {
    return this.hasWait(this.$waits.onTimelapseSaveFrame)
  }

  saveFrames () {
    SocketActions.machineTimelapseSaveFrames(this.$waits.onTimelapseSaveFrame)
  }

  // -- settings ---------------------------------------------------------------------

  blocked (setting: keyof TimelapseSettings): boolean {
    return this.$store.getters['timelapse/isBlockedSetting'](setting) as boolean
  }

  set (change: Partial<TimelapseWritableSettings>) {
    SocketActions.machineTimelapseSetSettings(change)
  }

  openDialog (renders: boolean) {
    this.dialogRenders = renders
    this.dialogOpen = true
  }
}
</script>

<style lang="scss" scoped>
  .tl {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 380px;
    gap: 16px;
    align-items: start;
  }

  .tl__videos {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }

  .tl__head {
    display: flex;
    align-items: baseline;
    gap: 10px;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
    }
  }

  .tl__sub,
  .tl__note {
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .tl__note {
    margin: 0;
  }

  .tl__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 14px;
  }

  .tl__item {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 18px;
    background: var(--m3d-surface);
  }

  .tl__picture {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 16 / 9;
    background: #111;
    color: var(--m3d-text-subtle);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .tl__play {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    font-size: 16px;
  }

  .tl__meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 14px 4px;
    min-width: 0;

    b {
      overflow: hidden;
      font-size: 15px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 12px;
    }
  }

  .tl__actions {
    display: flex;
    gap: 14px;
    padding: 6px 14px 12px;
  }

  .tl__link {
    color: var(--m3d-accent);
    font-size: 13px;
    font-weight: 600;
  }

  .tl__link--danger {
    color: var(--m3d-danger);
  }

  .tl__side {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .tl__frame img,
  .tl__camera {
    display: block;
    width: 100%;
    border-radius: 14px;
  }

  .tl__slider {
    display: flex;
    flex-direction: column;
    gap: 4px;

    > span {
      color: var(--m3d-text-muted);
      font-size: 12px;
    }
  }

  .tl__render {
    margin: 0;
    color: var(--m3d-accent);
    font-size: 14px;
    font-weight: 600;
  }

  .tl__buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .tl__rows {
    display: flex;
    flex-direction: column;

    > .crow + .crow {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .tl__player {
    background: #000;

    video {
      display: block;
      width: 100%;
      max-height: 80vh;
    }
  }

  @media (max-width: 1100px) {
    .tl {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
