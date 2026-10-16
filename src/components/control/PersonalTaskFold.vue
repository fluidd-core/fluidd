<template>
  <div>
    <task-fold
      :fold-id="foldId"
      :title="title"
      :summary="summary"
      :value="open"
      @input="choose"
    >
      <slot />
    </task-fold>
    <p
      v-if="store.state.error"
      class="personal-fold__error"
      role="status"
    >
      {{ store.state.error }}
      <button
        type="button"
        @click="retry"
      >
        Try again
      </button>
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import TaskFold from './TaskFold.vue'
import { ControlPreferenceStore, REMEMBER_CONTROL_FOLDS, type PreferenceContext } from '@/services/control/preferences'
import { controlPreferenceStore } from '@/services/account/control-preferences'
import { cloudState } from '@/services/muon-cloud/state'
import { storedToken } from '@/services/muon-cloud/api'

@Component({ components: { TaskFold } })
export default class PersonalTaskFold extends Vue {
  @Prop({ type: String, required: true }) readonly printerId!: string
  @Prop({ type: String, required: true }) readonly foldKey!: string
  @Prop({ type: String, required: true }) readonly foldId!: string
  @Prop({ type: String, required: true }) readonly title!: string
  @Prop({ type: String, required: true }) readonly summary!: string
  @Prop({ type: Object }) readonly preferences?: ControlPreferenceStore

  get store (): ControlPreferenceStore { return this.preferences ?? controlPreferenceStore }

  get identity (): string { return `${cloudState.account?.id ?? ''}/${this.printerId}` }
  get open (): boolean { return this.store.isSelected(this.context()) && this.store.state.folds[this.foldKey] === true }

  context (): PreferenceContext {
    return { accountId: cloudState.account?.id ?? null, printerId: this.printerId || null, token: cloudState.account ? storedToken() : null }
  }

  @Watch('identity', { immediate: true })
  refresh () { return this.store.select(this.context()) }

  mounted () {
    if (!REMEMBER_CONTROL_FOLDS) this.store.setFold(this.foldKey, false)
    window.addEventListener('focus', this.refresh)
    document.addEventListener('visibilitychange', this.onVisibility)
  }

  beforeDestroy () {
    window.removeEventListener('focus', this.refresh)
    document.removeEventListener('visibilitychange', this.onVisibility)
  }

  onVisibility () { if (!document.hidden) this.refresh() }
  choose (open: boolean) { this.refresh(); return this.store.setFold(this.foldKey, open) }
  retry () { this.refresh(); return this.store.retry() }
}
</script>

<style scoped>
  .personal-fold__error {
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  .personal-fold__error button {
    color: var(--m3d-accent);
    text-decoration: underline;
  }
</style>
