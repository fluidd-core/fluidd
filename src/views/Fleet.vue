<template>
  <div class="fleet">
    <header class="fleet__head">
      <div>
        <h1 class="fleet__title">
          Fleet
        </h1>
        <div
          v-if="account"
          class="fleet__summary"
        >
          {{ printers.length }} linked · {{ onlineCount }} online · {{ printingCount }} printing
        </div>
      </div>
      <v-spacer />
      <template v-if="account">
        <v-btn
          small
          text
          @click="customise = !customise"
        >
          <v-icon
            small
            left
          >
            {{ icons.tune }}
          </v-icon>
          Customise
        </v-btn>
        <v-btn
          small
          text
          @click="addGroup"
        >
          <v-icon
            small
            left
          >
            {{ icons.group }}
          </v-icon>
          New group
        </v-btn>
        <app-btn
          small
          color="primary"
          @click="linkDialog = true"
        >
          <v-icon
            small
            left
          >
            {{ icons.link }}
          </v-icon>
          Link a printer
        </app-btn>
      </template>
    </header>

    <v-card
      v-if="!account"
      class="fleet__empty"
    >
      <v-card-title>Your printers, from anywhere</v-card-title>
      <v-card-text>
        Sign in to your Muon3D account to see every printer you have linked, group them, and open any of them over the Muon3D network.
      </v-card-text>
      <v-card-actions>
        <app-btn
          color="primary"
          @click="accountDialog = true"
        >
          Sign in
        </app-btn>
      </v-card-actions>
    </v-card>

    <template v-else>
      <v-expand-transition>
        <div
          v-if="customise"
          class="fleet__customise"
        >
          <div class="fleet__customise-label">
            Show on each card
          </div>
          <v-chip-group
            column
            multiple
            :value="enabledWidgets"
            @change="setWidgets"
          >
            <v-chip
              v-for="w in widgetList"
              :key="w.key"
              :value="w.key"
              filter
              small
              outlined
            >
              {{ w.label }}
            </v-chip>
          </v-chip-group>
          <v-btn-toggle
            :value="layout.density"
            mandatory
            dense
            class="mt-2"
            @change="setDensity"
          >
            <v-btn
              small
              value="comfortable"
            >
              Comfortable
            </v-btn>
            <v-btn
              small
              value="compact"
            >
              Compact
            </v-btn>
          </v-btn-toggle>
        </div>
      </v-expand-transition>

      <div
        v-if="!printers.length"
        class="fleet__none"
      >
        No printers are linked yet. Choose <strong>Link a printer</strong> while you are on the printer's network,
        then confirm on the printer's screen.
      </div>

      <section
        v-for="group in sections"
        :key="group.id"
        class="fleet__group"
        :class="{ 'is-drop': dropTarget === group.id }"
        @dragover.prevent="dropTarget = group.id"
        @dragleave="dropTarget = null"
        @drop.prevent="drop(group.id)"
      >
        <div class="fleet__group-head">
          <input
            v-if="group.id !== 'ungrouped'"
            class="fleet__group-name"
            :value="group.name"
            @change="onRename(group.id, $event)"
          >
          <span
            v-else
            class="fleet__group-name is-static"
          >{{ group.name }}</span>
          <span class="fleet__group-count">{{ group.printers.length }}</span>
          <v-spacer />
          <v-btn
            v-if="group.id !== 'ungrouped'"
            icon
            x-small
            @click="removeGroup(group.id)"
          >
            <v-icon x-small>
              $delete
            </v-icon>
          </v-btn>
        </div>
        <div
          class="fleet__grid"
          :class="{ 'is-compact': layout.density === 'compact' }"
        >
          <fleet-card
            v-for="p in group.printers"
            :key="p.id"
            :printer="p"
            :status="status[p.id] || null"
            :widgets="layout.widgets"
            :index="indexOf(p.id)"
            :compact="layout.density === 'compact'"
            @dragstart="dragging = p.id"
            @open="open"
          />
          <div
            v-if="!group.printers.length"
            class="fleet__drop-hint"
          >
            Drag printers here
          </div>
        </div>
      </section>
    </template>

    <cloud-account-dialog
      v-if="accountDialog"
      v-model="accountDialog"
    />
    <link-printer-dialog
      v-if="linkDialog"
      v-model="linkDialog"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { cloudState, saveLayout, type FleetLayout } from '@/services/muon-cloud/state'
import { printerPath } from '@/services/printer-pages'
import { slugForCloudPrinter } from '@/services/printer-pages/slug'
import FleetCard from '@/components/muon-cloud/FleetCard.vue'
import CloudAccountDialog from '@/components/muon-cloud/CloudAccountDialog.vue'
import LinkPrinterDialog from '@/components/muon-cloud/LinkPrinterDialog.vue'

@Component({ components: { FleetCard, CloudAccountDialog, LinkPrinterDialog } })
export default class Fleet extends Vue {
  customise = false
  accountDialog = false
  linkDialog = false
  dragging: string | null = null
  dropTarget: string | null = null
  icons = { link: '$linkPrinter', tune: '$tuneVariant', group: '$folderPlus' }

  widgetList = [
    { key: 'model', label: '3D model' },
    { key: 'progress', label: 'Progress' },
    { key: 'eta', label: 'Time' },
    { key: 'file', label: 'File' },
    { key: 'layer', label: 'Layer' },
    { key: 'temps', label: 'Temperatures' },
    { key: 'position', label: 'Position' },
    { key: 'factors', label: 'Speed and flow' }
  ]

  get account () {
    return cloudState.account
  }

  get printers () {
    return cloudState.printers
  }

  get status () {
    return cloudState.status
  }

  get layout (): FleetLayout {
    return cloudState.layout
  }

  get onlineCount () {
    return this.printers.filter(p => p.online).length
  }

  get printingCount () {
    return this.printers.filter(p => cloudState.status[p.id]?.state === 'printing').length
  }

  get enabledWidgets () {
    return Object.entries(this.layout.widgets).filter(([, v]) => v).map(([k]) => k)
  }

  get sections () {
    const grouped = new Set<string>()
    const byId = new Map(this.printers.map(p => [p.id, p]))
    const groups = this.layout.groups.map(g => {
      const members = g.printers.filter(id => byId.has(id))
      members.forEach(id => grouped.add(id))
      return { id: g.id, name: g.name, printers: members.map(id => byId.get(id)!) }
    })
    const rest = this.printers.filter(p => !grouped.has(p.id))
    if (rest.length || !groups.length) {
      groups.push({ id: 'ungrouped', name: groups.length ? 'Ungrouped' : 'All printers', printers: rest })
    }
    return groups
  }

  indexOf (id: string) {
    return this.printers.findIndex(p => p.id === id) + 1
  }

  persist (next: Partial<FleetLayout>) {
    saveLayout({ ...this.layout, ...next })
  }

  setWidgets (keys: string[]) {
    const widgets: Record<string, boolean> = {}
    for (const w of this.widgetList) widgets[w.key] = keys.includes(w.key)
    this.persist({ widgets })
  }

  setDensity (density: 'comfortable' | 'compact') {
    this.persist({ density })
  }

  addGroup () {
    const id = `g${Date.now().toString(36)}`
    this.persist({ groups: [...this.layout.groups, { id, name: `Group ${this.layout.groups.length + 1}`, printers: [] }] })
  }

  renameGroup (id: string, name: string) {
    this.persist({ groups: this.layout.groups.map(g => (g.id === id ? { ...g, name: name.trim() || g.name } : g)) })
  }

  onRename (id: string, event: Event) {
    this.renameGroup(id, (event.target as HTMLInputElement).value)
  }

  removeGroup (id: string) {
    this.persist({ groups: this.layout.groups.filter(g => g.id !== id) })
  }

  drop (groupId: string) {
    const id = this.dragging
    this.dragging = null
    this.dropTarget = null
    if (!id) return
    const groups = this.layout.groups.map(g => ({ ...g, printers: g.printers.filter(p => p !== id) }))
    const target = groups.find(g => g.id === groupId)
    if (target) target.printers.push(id)
    this.persist({ groups })
  }

  /** The printer's own page, which opens it (services/printer-pages). */
  open (id: string) {
    const printer = cloudState.printers.find(p => p.id === id)
    if (printer) this.$router.push(printerPath(slugForCloudPrinter(printer))).catch(() => {})
  }
}
</script>

<style lang="scss" scoped>
.fleet {
  padding: 4px 4px 24px;

  &__head {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 14px;
  }

  &__title {
    font-size: 24px;
    font-weight: 700;
    line-height: 1.2;
  }

  &__summary {
    font-size: 13px;
    opacity: 0.7;
  }

  &__empty {
    max-width: 520px;
  }

  &__none {
    padding: 18px;
    border: 1px dashed rgba(128, 128, 128, 0.4);
    border-radius: 10px;
    opacity: 0.8;
  }

  &__customise {
    padding: 12px 14px;
    margin-bottom: 14px;
    border: 1px solid rgba(128, 128, 128, 0.25);
    border-radius: 10px;
  }

  &__customise-label {
    font-size: 12px;
    font-weight: 600;
    opacity: 0.7;
  }

  &__group {
    margin-bottom: 18px;
    padding: 8px;
    border: 1px solid transparent;
    border-radius: 10px;
    transition: border-color 120ms ease, background 120ms ease;

    &.is-drop {
      border-color: var(--v-primary-base);
      background: rgba(128, 128, 128, 0.06);
    }
  }

  &__group-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__group-name {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: inherit;
    background: transparent;
    border: 0;
    outline: 0;
    padding: 2px 0;
    min-width: 60px;

    &:focus {
      border-bottom: 1px solid var(--v-primary-base);
    }
  }

  &__group-count {
    font-size: 11px;
    opacity: 0.6;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 14px;

    &.is-compact {
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    }
  }

  &__drop-hint {
    padding: 28px;
    text-align: center;
    font-size: 12px;
    opacity: 0.5;
    border: 1px dashed rgba(128, 128, 128, 0.35);
    border-radius: 8px;
  }
}
</style>
