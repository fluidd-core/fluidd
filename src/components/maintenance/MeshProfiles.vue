<template>
  <control-card
    title="Mesh profiles"
    :locked="klippyReady ? '' : 'The printer isn\'t ready.'"
    data-tid="mesh-profiles"
  >
    <template #aside>
      <span>{{ activeName ? `using ${activeName}` : 'none loaded' }}</span>
    </template>

    <div
      v-if="profiles.length"
      class="mprof__list"
    >
      <div
        v-for="profile in profiles"
        :key="profile.name"
        class="crow"
        :data-profile="profile.name"
      >
        <span class="crow__name">
          {{ profile.name }}
          <span class="crow__sub">· {{ profile.range.toFixed(3) }} mm{{ profile.adaptive ? ' · adaptive' : '' }}</span>
        </span>
        <span class="mprof__actions">
          <span
            v-if="profile.active"
            class="mprof__pill"
          >in use</span>
          <button
            v-else
            type="button"
            class="mprof__link"
            :disabled="!klippyReady"
            @click="load(profile.name)"
          >
            Load
          </button>
          <button
            v-if="!profile.adaptive"
            type="button"
            class="mprof__link mprof__link--danger"
            :disabled="!klippyReady"
            :aria-label="`Remove ${profile.name}`"
            @click="remove(profile.name)"
          >
            Remove
          </button>
        </span>
      </div>
    </div>
    <p
      v-else
      class="mprof__note"
    >
      No saved profiles yet. Measure the bed, then save it under a name.
    </p>

    <div class="mprof__buttons">
      <button
        type="button"
        class="cbtn cbtn--primary"
        :disabled="!meshRow || !!checksBlocked"
        :title="checksBlocked"
        data-tid="mesh-measure"
        @click="meshRow && runCheck(meshRow)"
      >
        {{ measuring ? 'Measuring…' : 'Measure the bed' }}
      </button>
      <button
        type="button"
        class="cbtn"
        :disabled="!klippyReady || !activeName"
        data-tid="mesh-save-as"
        @click="saveOpen = true"
      >
        Save as…
      </button>
      <button
        type="button"
        class="cbtn cbtn--ghost"
        :disabled="!klippyReady || !activeName"
        @click="clear"
      >
        Clear
      </button>
    </div>

    <div
      v-if="saveConfigPending"
      class="mprof__pending"
      data-tid="mesh-pending"
    >
      <span>Saved profiles and new results reach printer.cfg when Klipper saves them, which restarts it.</span>
      <button
        type="button"
        class="cbtn cbtn--primary"
        :disabled="!!saveBlocked"
        :title="saveBlocked"
        @click="saveResults"
      >
        Save to printer.cfg
      </button>
    </div>

    <file-name-dialog
      v-if="saveOpen"
      v-model="saveOpen"
      title="Save the mesh as"
      label="Profile name"
      :name="activeName === 'default' ? '' : activeName"
      @save="saveAs"
    />
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import MaintenanceMixin from '@/mixins/maintenance'
import type { BedMeshProfileListEntry } from '@/store/mesh/types'
import { meshProfileCommand, validProfileName } from '@/services/maintenance/model'
import ControlCard from '@/components/control/ControlCard.vue'
import FileNameDialog from '@/components/widgets/filesystem/FileNameDialog.vue'

/**
 * Pro's mesh profiles: the saved ones with how uneven each is, loading and
 * removing them, measuring the bed (the same check as Maintenance, so it
 * counts there too), saving the mesh in use under a name, and saving to
 * printer.cfg when Klipper has results waiting.
 */
@Component({ components: { ControlCard, FileNameDialog } })
export default class MeshProfiles extends Mixins(MaintenanceMixin) {
  saveOpen = false

  get profiles (): BedMeshProfileListEntry[] {
    return (this.$store.getters['mesh/getBedMeshProfiles'] as BedMeshProfileListEntry[]) ?? []
  }

  get activeName (): string {
    return this.$store.state.printer.printer.bed_mesh?.profile_name ?? ''
  }

  get meshRow () {
    return this.checks.find(c => c.id === 'bedMesh')
  }

  /** A measurement that finishes while this page is open counts on Maintenance too. */
  @Watch('evidence', { immediate: true })
  onEvidence () {
    this.recordIfDone()
  }

  async load (name: string) {
    // Mid-print, a different mesh moves the nozzle under the part.
    if (this.printerPrinting && !(await this.$confirm(`Load ${name} while printing? The nozzle follows the new mesh from the next move.`, { title: 'Load a mesh', color: 'card-heading', icon: '$error' }))) return
    this.sendGcode(meshProfileCommand('LOAD', name))
  }

  async remove (name: string) {
    if (!(await this.$confirm(`Remove the profile ${name}? It goes from printer.cfg when Klipper next saves.`, { title: 'Remove a profile', color: 'card-heading', icon: '$error' }))) return
    this.sendGcode(meshProfileCommand('REMOVE', name))
  }

  async clear () {
    if (this.printerPrinting && !(await this.$confirm('Clear the mesh while printing? The nozzle stops following the bed from the next move.', { title: 'Clear the mesh', color: 'card-heading', icon: '$error' }))) return
    this.sendGcode('BED_MESH_CLEAR')
  }

  saveAs (name: string) {
    if (!validProfileName(name)) {
      this.$store.dispatch('notifications/pushNotification', { title: 'Not saved', description: 'A profile name takes letters, numbers, spaces, dots, dashes and underscores.', type: 'error', snackbar: true })
      return
    }
    this.sendGcode(meshProfileCommand('SAVE', name))
  }
}
</script>

<style lang="scss" scoped>
  .mprof__list {
    display: flex;
    flex-direction: column;

    > .crow + .crow {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .mprof__actions {
    display: inline-flex;
    align-items: center;
    gap: 14px;
  }

  .mprof__pill {
    padding: 2px 10px;
    border-radius: 999px;
    background: rgba(128, 214, 209, 0.16);
    color: var(--m3d-accent);
    font-size: 12px;
    font-weight: 600;
  }

  .mprof__link {
    color: var(--m3d-accent);
    font-size: 13px;
    font-weight: 600;

    &:disabled {
      opacity: 0.45;
    }
  }

  .mprof__link--danger {
    color: var(--m3d-danger);
  }

  .mprof__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .mprof__buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .mprof__pending {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 14px;
    padding: 12px 14px;
    border-radius: 14px;
    background: rgba(255, 159, 10, 0.1);
    color: var(--m3d-text);
    font-size: 13px;

    span {
      flex: 1 1 200px;
    }
  }
</style>
