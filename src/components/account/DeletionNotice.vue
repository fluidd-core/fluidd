<template>
  <section
    class="lib-surface deletion-notice"
    role="status"
    :data-tid="tid"
  >
    <h2>Deletion pending</h2>
    <p>Your cloud printers, Library and sharing are paused until you keep your account.</p>
    <p>Printers on your network still work.</p>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class DeletionNotice extends Vue {
  @Prop({ type: String, default: 'deletion-unavailable' })
  readonly tid!: string
}
</script>

<style lang="scss" scoped>
.deletion-notice {
  padding: 20px;
  margin-bottom: 16px;
  h2 { margin: 0 0 8px; font-size: 18px; }
  p { margin: 4px 0; color: var(--m3d-text-muted); font-size: 14px; }
}
</style>
