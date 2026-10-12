<template>
  <div
    v-if="url && !failed"
    class="foreign-camera"
  >
    <video
      v-if="video"
      :src="url"
      autoplay
      muted
      playsinline
      controls
      @error="onError"
    />
    <img
      v-else
      :src="url"
      alt="Printer camera"
      @error="onError"
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
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

@Component
export default class ForeignCamera extends Vue {
  @Prop({ type: String, default: null })
  readonly url!: string | null

  failed = false

  get video () {
    return /\.(mp4|m3u8)(?:$|[?#])/i.test(this.url ?? '')
  }

  @Watch('url')
  onUrlChanged () {
    this.failed = false
    this.$emit('failed', false)
  }

  onError () {
    this.failed = true
    this.$emit('failed', true)
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
