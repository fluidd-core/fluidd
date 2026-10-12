<template>
  <div
    v-if="url"
    class="foreign-camera"
  >
    <video
      v-if="video"
      :src="url"
      autoplay
      muted
      playsinline
      controls
    />
    <img
      v-else
      :src="url"
      alt="Printer camera"
    >
  </div>
  <p
    v-else
    class="foreign-camera__empty"
  >
    This printer doesn't publish a camera Fluidd can show.
  </p>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class ForeignCamera extends Vue {
  @Prop({ type: String, default: null })
  readonly url!: string | null

  get video () {
    return /\.(mp4|m3u8)(?:$|[?#])/i.test(this.url ?? '')
  }
}
</script>

<style scoped>
.foreign-camera img,
.foreign-camera video {
  display: block;
  width: 100%;
  max-height: 72vh;
  object-fit: contain;
  background: #111;
}

.foreign-camera__empty {
  color: var(--m3d-text-muted);
}
</style>
