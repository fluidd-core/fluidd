<template>
  <svg
    class="frame-icon"
    :class="{ 'frame-icon--small': small, 'frame-icon--large': large }"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <template v-for="(shape, i) in shapes">
      <circle
        v-if="shape.c"
        :key="i"
        :cx="shape.c[0]"
        :cy="shape.c[1]"
        :r="shape.c[2]"
      />
      <rect
        v-else-if="shape.r"
        :key="i"
        :x="shape.r[0]"
        :y="shape.r[1]"
        :width="shape.r[2]"
        :height="shape.r[3]"
        :rx="shape.r[4]"
      />
      <path
        v-else
        :key="i"
        :d="shape.d"
      />
    </template>
  </svg>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

type Shape = { d?: string, c?: number[], r?: number[] }

// The frame's line icons: one stroke weight, drawn on a 24 px grid, so the
// rail, header and tabs never mix icon sets or squash one to fit.
const ICONS: Record<string, Shape[]> = {
  printers: [{ r: [3, 3, 7.5, 7.5, 2] }, { r: [13.5, 3, 7.5, 7.5, 2] }, { r: [3, 13.5, 7.5, 7.5, 2] }, { r: [13.5, 13.5, 7.5, 7.5, 2] }],
  overview: [{ d: 'M12 14l4-4' }, { d: 'M3.3 19a10 10 0 1 1 17.4 0' }],
  jobs: [{ d: 'M12 2 2 7l10 5 10-5-10-5z' }, { d: 'm2 17 10 5 10-5' }, { d: 'm2 12 10 5 10-5' }],
  control: [{ d: 'M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4' }],
  slice: [{ d: 'M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7Z' }, { d: 'm3.3 7 8.7 5 8.7-5M12 22V12' }],
  camera: [{ d: 'm16 13 5.2 3.5a.5.5 0 0 0 .8-.4V7.9a.5.5 0 0 0-.8-.4L16 11' }, { r: [2, 6, 14, 12, 2.5] }],
  maintenance: [{ d: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z' }],
  settings: [{ c: [12, 12, 3] }, { d: 'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z' }],
  console: [{ d: 'm4 17 6-6-6-6M12 19h8' }],
  files: [{ d: 'M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z' }],
  bell: [{ d: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' }, { d: 'M10.3 21a1.94 1.94 0 0 0 3.4 0' }],
  keyboard: [{ r: [2, 5, 20, 14, 2.5] }, { d: 'M6 9h.01M10 9h.01M14 9h.01M18 9h.01M7 13h.01M11 13h.01M15 13h.01M8 16h8' }],
  search: [{ c: [11, 11, 7] }, { d: 'm20 20-3.5-3.5' }],
  chevronDown: [{ d: 'm6 9 6 6 6-6' }],
  chevronRight: [{ d: 'm9 6 6 6-6 6' }],
  chevronLeft: [{ d: 'm15 18-6-6 6-6' }],
  list: [{ d: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' }],
  estop: [{ d: 'M7.9 2h8.2L22 7.9v8.2L16.1 22H7.9L2 16.1V7.9z' }, { d: 'M12 7v6M12 16.5h.01' }],
  wifi: [{ d: 'M5 12.6a11 11 0 0 1 14 0M1.4 9a16 16 0 0 1 21.2 0M8.5 16.1a6 6 0 0 1 7 0M12 20h.01' }],
  cloud: [{ d: 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z' }],
  plus: [{ d: 'M5 12h14M12 5v14' }],
  more: [{ c: [5, 12, 1.2] }, { c: [12, 12, 1.2] }, { c: [19, 12, 1.2] }],
  user: [{ d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' }, { c: [12, 7, 4] }],
  layout: [{ r: [3, 3, 18, 18, 2] }, { d: 'M3 9h18M9 21V9' }],
  power: [{ d: 'M12 2v10' }, { d: 'M18.4 6.6a9 9 0 1 1-12.77.04' }],
  x: [{ d: 'M18 6 6 18M6 6l12 12' }],
  refresh: [{ d: 'M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8' }, { d: 'M21 3v5h-5' }]
}

@Component({})
export default class FrameIcon extends Vue {
  @Prop({ type: String, required: true })
  readonly name!: string

  @Prop({ type: Boolean })
  readonly small?: boolean

  @Prop({ type: Boolean })
  readonly large?: boolean

  get shapes (): Shape[] {
    return ICONS[this.name] ?? []
  }
}
</script>

<style lang="scss" scoped>
  .frame-icon {
    width: 20px;
    height: 20px;
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .frame-icon--small {
    width: 16px;
    height: 16px;
  }

  .frame-icon--large {
    width: 24px;
    height: 24px;
  }
</style>
