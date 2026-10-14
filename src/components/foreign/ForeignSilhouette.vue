<template>
  <svg
    class="foreign-silhouette"
    viewBox="0 0 112 80"
    role="img"
    aria-label="Printer"
  >
    <g
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2.5"
    >
      <template v-if="formFactor === 'enclosed'">
        <path d="M18 69V14h76v55M14 69h84M27 61V23h58v38M56 23v38M26 69h60" />
        <path d="M44 61V48l12-9 12 9v13M56 39v-8" />
      </template>
      <template v-else-if="formFactor === 'open-frame'">
        <path d="M14 68h84M22 67V14h68v53M22 22h68M30 61h52M37 61V39h38v22M56 22v17" />
        <path d="M49 39v-8h14v8" />
      </template>
      <template v-else>
        <path d="M12 67h88M20 65V20h72v45M24 26h64M31 60h49M38 59V39h34v20M55 26v13" />
        <path d="M43 39v-7h24v7M17 15h78M28 15l-8 5M84 15l8 5" />
      </template>
    </g>
  </svg>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { FormFactor } from '@/services/foreign-printers/types'

@Component
export default class ForeignSilhouette extends Vue {
  @Prop({ type: String, required: true })
  readonly formFactor!: FormFactor
}
</script>

<style scoped>
.foreign-silhouette {
  width: 64px;
  height: 48px;
  color: var(--m3d-text-muted);
}
</style>
