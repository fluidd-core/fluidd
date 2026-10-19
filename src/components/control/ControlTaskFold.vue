<template>
  <div>
    <personal-task-fold
      v-if="printerId"
      :key="connection"
      :printer-id="printerId"
      :fold-key="foldKey"
      :fold-id="foldKey"
      :title="title"
      :summary="summary"
      :choice="choice"
    >
      <template #default="selection">
        <slot v-bind="selection || {}" />
      </template>
    </personal-task-fold>
    <template v-else>
      <slot
        v-if="choice"
        :value="open"
        :choose="choose"
      />
      <task-fold
        v-else
        :fold-id="foldKey"
        :title="title"
        :summary="summary"
        :value="open"
        @input="open = $event"
      >
        <slot />
      </task-fold>
      <p
        v-if="open || choice"
        class="control-fold__note"
      >
        These choices last for this visit.
      </p>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import TaskFold from './TaskFold.vue'
import PersonalTaskFold from './PersonalTaskFold.vue'
import { cloudState } from '@/services/muon-cloud/state'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'
import { isManagedApiUrl } from '@/services/muon-cloud/origin'

@Component({ components: { TaskFold, PersonalTaskFold } })
export default class ControlTaskFold extends Vue {
  @Prop({ type: String, required: true }) readonly foldKey!: string
  @Prop({ type: String, required: true }) readonly title!: string
  @Prop({ type: String, required: true }) readonly summary!: string
  @Prop({ type: Boolean }) readonly choice?: boolean
  open = false
  choose (value: boolean) { this.open = value }

  get printerId (): string {
    return isManagedApiUrl(this.$store.state.config.apiUrl) && printerTransportBinding.remote ? cloudState.activePrinterId ?? '' : ''
  }

  get connection (): string { return `${this.$store.state.config.apiUrl}|${this.printerId}|${cloudState.account?.id ?? ''}` }

  @Watch('connection')
  reset () { this.open = false }
}
</script>

<style scoped>
.control-fold__note { color: var(--m3d-text-subtle); font-size: 12px; }
</style>
