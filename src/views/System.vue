<template>
  <div
    class="sys"
    :class="{ 'sys--phone': isMobileViewport }"
    data-tid="system-page"
  >
    <div class="sys__col">
      <control-card
        title="Power and services"
        data-tid="system-power"
      >
        <div
          v-if="canControlHost"
          class="sys__group"
        >
          <h3 class="sys__label">
            {{ printerName }}'s computer
          </h3>
          <div class="sys__buttons">
            <button
              type="button"
              class="cbtn"
              :disabled="printerPrinting"
              data-tid="system-reboot"
              @click="reboot"
            >
              Restart it
            </button>
            <button
              type="button"
              class="cbtn cbtn--ghost"
              :disabled="printerPrinting"
              data-tid="system-shutdown"
              @click="shutDown"
            >
              Shut it down
            </button>
          </div>
          <p
            v-if="printerPrinting"
            class="sys__note"
          >
            Not while printing.
          </p>
        </div>

        <div class="sys__group">
          <h3 class="sys__label">
            Klipper
          </h3>
          <div class="sys__buttons">
            <button
              type="button"
              class="cbtn"
              data-tid="system-restart-klipper"
              @click="klippyConnected ? restartKlippy() : serviceRestartKlipper()"
            >
              Restart Klipper
            </button>
            <button
              v-if="klippyConnected"
              type="button"
              class="cbtn"
              data-tid="system-firmware-restart"
              @click="firmwareRestartKlippy"
            >
              Restart the firmware too
            </button>
          </div>
          <p class="sys__note">
            A restart reads printer.cfg again. Restarting the firmware also resets the control boards, after an error that needs it.
          </p>
        </div>

        <div
          v-if="powerDevices.length"
          class="sys__group"
        >
          <h3 class="sys__label">
            Power
          </h3>
          <div
            v-for="device in powerDevices"
            :key="device.device"
            class="crow"
          >
            <span class="crow__name">{{ device.device }} <span class="crow__sub">· {{ device.status }}</span></span>
            <toggle-switch
              :value="device.status === 'on'"
              :label="device.device"
              :disabled="device.status === 'error' || device.status === 'init' || (printerPrinting && device.locked_while_printing)"
              @input="togglePower(device)"
            />
          </div>
        </div>

        <div class="sys__group">
          <h3 class="sys__label">
            Services
          </h3>
          <div
            v-for="service in services"
            :key="service.name"
            class="crow"
            :data-service="service.name"
          >
            <span class="crow__name sys__service">{{ service.name }}</span>
            <span class="sys__service-actions">
              <tone-pill
                :tone="service.state.tone"
                :dot="false"
              >
                {{ service.state.text }}
              </tone-pill>
              <button
                v-if="service.inactive"
                type="button"
                class="sys__link"
                @click="start(service.name)"
              >
                Start
              </button>
              <button
                v-else
                type="button"
                class="sys__link"
                @click="restart(service.name)"
              >
                Restart
              </button>
              <button
                v-if="!service.inactive && service.name !== moonrakerServiceName"
                type="button"
                class="sys__link sys__link--danger"
                @click="stop(service.name)"
              >
                Stop
              </button>
            </span>
          </div>
        </div>
      </control-card>

      <control-card
        :title="`${printerName}'s computer`"
        data-tid="system-host"
      >
        <dl class="sys__facts">
          <div
            v-for="fact in hostFacts"
            :key="fact.label"
          >
            <dt>{{ fact.label }}</dt>
            <dd>{{ fact.value }}</dd>
          </div>
        </dl>
        <div class="sys__buttons">
          <button
            type="button"
            class="cbtn"
            @click="devicesOpen = true"
          >
            Devices plugged in
          </button>
          <button
            type="button"
            class="cbtn"
            @click="downloadFile('klippy.log', '')"
          >
            <frame-icon
              name="download"
              small
            />
            klippy.log
          </button>
          <button
            type="button"
            class="cbtn"
            @click="downloadFile('moonraker.log', '')"
          >
            <frame-icon
              name="download"
              small
            />
            moonraker.log
          </button>
          <button
            v-if="canRollover"
            type="button"
            class="cbtn cbtn--ghost"
            @click="rolloverOpen = true"
          >
            Start new log files
          </button>
        </div>
      </control-card>

      <control-card
        v-if="disk"
        title="Storage"
        data-tid="system-disk"
      >
        <div
          class="sys__bar"
          role="meter"
          :aria-valuenow="Math.round(disk.share * 100)"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Storage used"
        >
          <i :style="{ width: `${Math.round(disk.share * 100)}%` }" />
        </div>
        <p class="sys__note">
          {{ disk.text }}
        </p>
        <dl
          v-if="sdFacts.length"
          class="sys__facts"
        >
          <div
            v-for="fact in sdFacts"
            :key="fact.label"
          >
            <dt>{{ fact.label }}</dt>
            <dd>{{ fact.value }}</dd>
          </div>
        </dl>
      </control-card>
    </div>

    <div class="sys__col">
      <control-card
        title="How busy it is"
        data-tid="system-usage"
      >
        <template #aside>
          <span>the last 10 minutes</span>
        </template>
        <div class="sys__tiles">
          <div
            v-for="tile in tiles"
            :key="tile.key"
            class="sys__tile"
          >
            <span class="sys__tile-label">{{ tile.label }}</span>
            <b>{{ tile.value }}</b>
            <svg
              v-if="tile.path"
              viewBox="0 0 200 40"
              preserveAspectRatio="none"
              class="sys__spark"
              aria-hidden="true"
            >
              <path :d="tile.path" />
            </svg>
            <span class="sys__tile-sub">{{ tile.sub }}</span>
          </div>
        </div>
      </control-card>

      <control-card
        v-for="mcu in boards"
        :key="mcu.name"
        :title="mcu.title"
        :data-tid="`system-mcu-${mcu.name}`"
      >
        <template #aside>
          <button
            type="button"
            class="sys__link"
            @click="mcuOpen = mcu.raw"
          >
            Details
          </button>
        </template>
        <dl class="sys__facts">
          <div
            v-for="fact in mcu.facts"
            :key="fact.label"
          >
            <dt>{{ fact.label }}</dt>
            <dd>{{ fact.value }}</dd>
          </div>
        </dl>
      </control-card>
    </div>

    <peripherals-dialog
      v-if="devicesOpen"
      v-model="devicesOpen"
    />
    <rollover-logs-dialog
      v-if="rolloverOpen"
      v-model="rolloverOpen"
    />
    <mcu-information-dialog
      v-if="mcuOpen"
      :value="!!mcuOpen"
      :mcu="mcuOpen"
      @input="!$event && (mcuOpen = null)"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import ServicesMixin from '@/mixins/services'
import BrowserMixin from '@/mixins/browser'
import { SocketActions } from '@/api/socketActions'
import type { Device } from '@/store/power/types'
import type { MCU } from '@/store/printer/types'
import type { ServiceInfo, SystemInfo } from '@/store/server/types'
import { chartLines } from '@/services/overview/model'
import { fileSize } from '@/services/jobs/model'
import { diskUse, frequency, latest, networkLines, osName, serviceState } from '@/services/system/model'
import ControlCard from '@/components/control/ControlCard.vue'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import TonePill from '@/components/printers/TonePill.vue'
import PeripheralsDialog from '@/components/common/PeripheralsDialog.vue'
import RolloverLogsDialog from '@/components/common/RolloverLogsDialog.vue'
import McuInformationDialog from '@/components/widgets/system/McuInformationDialog.vue'

type Points = Array<Record<string, unknown> & { date: Date }>

/**
 * System (Settings): restarting and shutting down the printer's computer,
 * restarting Klipper and its firmware, power devices and services; what
 * the computer is; how full its storage is; how busy it and Klipper,
 * Moonraker and each control board have been; and each board's details.
 */
@Component({ components: { ControlCard, ToggleSwitch, TonePill, PeripheralsDialog, RolloverLogsDialog, McuInformationDialog } })
export default class System extends Mixins(OverviewMixin, ServicesMixin, BrowserMixin) {
  devicesOpen = false
  rolloverOpen = false
  mcuOpen: MCU | null = null

  /** Moonraker reports the disk's use with a folder's listing; the G-code folder's is cheap. */
  mounted () {
    if (!(this.$store.getters['files/getUsage'] as { total?: number } | undefined)?.total) {
      SocketActions.serverFilesGetDirectory('gcodes', 'gcodes')
    }
  }

  get systemInfo (): SystemInfo | null {
    return this.$store.getters['server/getSystemInfo'] as SystemInfo | null
  }

  get canControlHost (): boolean {
    return this.systemInfo?.virtualization?.virt_type !== 'container'
  }

  get canRollover (): boolean {
    return this.$store.getters['server/getIsMinApiVersion']('1.0.5') as boolean
  }

  // -- power and services -------------------------------------------------------

  get powerDevices (): Device[] {
    if (!this.$store.getters['server/componentSupport']('power')) return []
    return (this.$store.getters['power/getDevices'] as Device[]) ?? []
  }

  get services () {
    return ((this.$store.getters['server/getServices'] as ServiceInfo[]) ?? [])
      .filter(s => s.name !== 'klipper_mcu')
      .map(s => ({ name: s.name, state: serviceState(s.active_state, s.sub_state), inactive: s.active_state === 'inactive' }))
  }

  async ask (text: string, title: string, button: string, danger = true): Promise<boolean> {
    return !!(await this.$confirm(text, { title, buttonTrueText: button, danger }))
  }

  async reboot () {
    if (await this.ask('This page loses touch with it for a minute or two.', `Restart ${this.printerName}'s computer?`, 'Restart')) this.hostReboot()
  }

  async shutDown () {
    if (await this.ask("It stays off until it's switched off and on at the printer.", `Shut down ${this.printerName}'s computer?`, 'Shut down')) this.hostShutdown()
  }

  async restart (name: string) {
    const printing = this.printerPrinting ? 'It is printing: restarting Klipper or Moonraker stops the print.' : 'It is back in a few seconds.'
    if (await this.ask(printing, `Restart ${name}?`, 'Restart', this.printerPrinting)) await this.serviceRestartByName(name)
  }

  async start (name: string) {
    await this.serviceStartByName(name)
  }

  async stop (name: string) {
    if (await this.ask("It stays stopped until it's started here or the computer restarts.", `Stop ${name}?`, 'Stop')) await this.serviceStopByName(name)
  }

  async togglePower (device: Device) {
    const confirm = this.$store.state.config.uiSettings.general.confirmOnPowerDeviceChange
    const next = device.status === 'on' ? 'off' : 'on'
    if (confirm && !(await this.ask(next === 'off' ? 'Whatever runs from it loses power at once.' : 'It switches on straight away.', `Turn ${device.device} ${next}?`, `Turn ${next}`, next === 'off'))) return
    SocketActions.machineDevicePowerToggle(device.device, next, `${this.$waits.onDevicePowerToggle}${device.device}`)
  }

  // -- the computer -----------------------------------------------------------------

  get hostFacts (): Array<{ label: string, value: string }> {
    const cpu = this.systemInfo?.cpu_info
    const facts: Array<{ label: string, value: string | null | undefined }> = [
      { label: 'Name on the network', value: this.$store.state.printer.printer.info?.hostname },
      { label: 'Board', value: cpu?.model || cpu?.hardware_desc },
      { label: 'Processor', value: [cpu?.processor, cpu?.cpu_count ? `${cpu.cpu_count} cores` : '', cpu?.bits].filter(Boolean).join(' · ') || cpu?.cpu_desc },
      { label: 'Memory', value: cpu?.total_memory ? fileSize(cpu.total_memory * 1024) : null },
      { label: 'Operating system', value: osName(this.systemInfo?.distribution) },
      { label: 'Network', value: networkLines(this.systemInfo?.network).join('\n') || null },
      { label: 'Runs in', value: this.systemInfo?.virtualization?.virt_type && this.systemInfo.virtualization.virt_type !== 'none' ? `${this.systemInfo.virtualization.virt_type} (${this.systemInfo.virtualization.virt_identifier})` : null }
    ]
    return facts.filter((f): f is { label: string, value: string } => !!f.value)
  }

  get disk () {
    return diskUse(this.$store.getters['files/getUsage'], fileSize)
  }

  get sdFacts (): Array<{ label: string, value: string }> {
    const sd = (this.systemInfo?.sd_info ?? {}) as Record<string, string | number | undefined>
    const facts = [
      { label: 'Card', value: [sd.manufacturer, sd.product_name].filter(Boolean).join(' ') },
      { label: 'Size', value: sd.capacity ? String(sd.capacity) : '' },
      { label: 'Made', value: sd.manufacturer_date ? String(sd.manufacturer_date) : '' }
    ]
    return facts.filter(f => f.value)
  }

  // -- how busy ---------------------------------------------------------------------

  series (name: string): Points {
    return ((this.$store.state.charts[name] as Points | undefined) ?? [])
  }

  spark (points: Points, key: string): string | null {
    if (points.length < 2) return null
    const data = points.map(p => ({ date: p.date, [key]: Number(p[key]) || 0 }))
    const span = (data[data.length - 1].date.getTime() - data[0].date.getTime()) / 1000
    return chartLines(data as never, [key], Math.max(10, span), data[data.length - 1].date.getTime(), 200, 40).lines[0]?.path ?? null
  }

  get tiles () {
    const klipper = this.series('klipper')
    const moonraker = this.series('moonraker')
    const memory = this.series('memory')
    const cores = this.systemInfo?.cpu_info?.cpu_count || 1
    const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v)}%`)
    const load = latest(klipper, 'load')
    return [
      { key: 'load', label: 'The computer', value: load === null ? '—' : load.toFixed(2), sub: `load, of ${cores} ${cores === 1 ? 'core' : 'cores'}`, path: this.spark(klipper, 'load') },
      { key: 'memory', label: 'Memory', value: pct(latest(memory, 'memused')), sub: 'in use', path: this.spark(memory, 'memused') },
      { key: 'klipper', label: 'Klipper', value: pct(latest(klipper, 'cputime_change')), sub: 'of a core', path: this.spark(klipper, 'cputime_change') },
      { key: 'moonraker', label: 'Moonraker', value: pct(latest(moonraker, 'load')), sub: 'of a core', path: this.spark(moonraker, 'load') },
      ...this.mcus.map(m => {
        const points = this.series(m.name)
        return { key: m.name, label: this.boardName(m.name), value: pct(latest(points, 'load') !== null ? latest(points, 'load')! * 100 : null), sub: 'busy', path: this.spark(points, 'load') }
      })
    ]
  }

  // -- control boards ---------------------------------------------------------------

  get mcus (): MCU[] {
    return (this.$store.getters['printer/getMcus'] as MCU[]) ?? []
  }

  boardName (name: string): string {
    if (name === 'mcu') return 'Main board'
    return name.replace(/^mcu\s+/, '').replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())
  }

  get boards () {
    return this.mcus.map(m => {
      const c = (m.mcu_constants ?? {}) as Record<string, string | number>
      const facts = [
        { label: 'Chip', value: String(c.MCU ?? '') },
        { label: 'Speed', value: c.CLOCK_FREQ ? frequency(Number(c.CLOCK_FREQ)) : '' },
        { label: 'Firmware', value: m.mcu_version ?? '' }
      ].filter(f => f.value)
      return { name: m.name, title: this.boardName(m.name), facts, raw: m }
    })
  }
}
</script>

<style lang="scss" scoped>
  .sys {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    align-items: start;
  }

  .sys__col {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .sys__group {
    display: flex;
    flex-direction: column;
    gap: 8px;

    > .crow + .crow {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .sys__label {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
  }

  .sys__buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .sys__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .sys__service {
    font-family: var(--m3d-font-mono, monospace);
    font-size: 13px;
  }

  .sys__service-actions {
    display: inline-flex;
    align-items: center;
    gap: 12px;
  }

  .sys__link {
    color: var(--m3d-accent);
    font-size: 13px;
    font-weight: 600;
  }

  .sys__link--danger {
    color: var(--m3d-danger);
  }

  .sys__facts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 8px;
    margin: 0;

    div {
      padding: 8px 12px;
      border-radius: 12px;
      background: var(--m3d-surface-2);
    }

    dt {
      color: var(--m3d-text-subtle);
      font-size: 11px;
    }

    dd {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      overflow-wrap: anywhere;
      white-space: pre-line;
    }
  }

  .sys__bar {
    height: 10px;
    overflow: hidden;
    border-radius: 5px;
    background: var(--m3d-surface-2);

    i {
      display: block;
      height: 100%;
      background: var(--m3d-accent);
    }
  }

  .sys__tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }

  .sys__tile {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--m3d-surface-2);

    b {
      font-size: 20px;
      font-variant-numeric: tabular-nums;
    }
  }

  .sys__tile-label {
    color: var(--m3d-text-muted);
    font-size: 12px;
  }

  .sys__tile-sub {
    color: var(--m3d-text-subtle);
    font-size: 11px;
  }

  .sys__spark {
    width: 100%;
    height: 32px;

    path {
      fill: none;
      stroke: var(--m3d-accent);
      stroke-width: 1.5;
      vector-effect: non-scaling-stroke;
    }
  }

  @media (max-width: 1100px) {
    .sys {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .sys--phone {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
</style>
