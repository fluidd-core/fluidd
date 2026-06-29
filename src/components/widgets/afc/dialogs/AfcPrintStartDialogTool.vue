<template>
  <v-row
    align="center"
    class="px-4 py-2 ma-0"
  >
    <v-col
      cols="auto"
      class="pr-2"
    >
      <v-tooltip
        v-if="warnings.length > 0"
        top
        max-width="300"
      >
        <template #activator="{ on, attrs }">
          <span
            v-bind="attrs"
            v-on="on"
          >
            <v-icon color="warning">
              $warning
            </v-icon>
          </span>
        </template>
        <div
          v-for="(warning, i) in warnings"
          :key="i"
          :class="{ 'mb-1': i < warnings.length - 1 }"
        >
          {{ warning }}
        </div>
      </v-tooltip>
      <v-icon
        v-else
        color="success"
      >
        $check
      </v-icon>
    </v-col>

    <!-- Tool name + file filament -->
    <v-col class="d-flex align-center">
      <v-tooltip
        v-if="fileFilament.name && fileFilament.name !== '--'"
        top
        max-width="200"
      >
        <template #activator="{ on, attrs }">
          <span
            class="d-flex align-center"
            v-bind="attrs"
            v-on="on"
          >
            <span class="text-subtitle-1 font-weight-bold mr-3">{{ toolName }}</span>
            <v-chip
              v-if="fileFilament.color"
              small
              :color="fileFilament.color"
              class="mr-1"
              style="min-width: 0; width: 20px; height: 20px; padding: 0;"
            />
            <span class="text-body-2 text--secondary">
              {{ fileFilament.material }}
              <template v-if="fileFilament.weight > 0">
                · {{ $filters.getReadableWeightString(fileFilament.weight) }}
              </template>
            </span>
          </span>
        </template>
        <span>{{ fileFilament.name }}</span>
      </v-tooltip>
      <template v-else>
        <span class="text-subtitle-1 font-weight-bold mr-3">{{ toolName }}</span>
        <v-chip
          v-if="fileFilament.color"
          small
          :color="fileFilament.color"
          class="mr-1"
          style="min-width: 0; width: 20px; height: 20px; padding: 0;"
        />
        <span class="text-body-2 text--secondary">
          {{ fileFilament.material }}
          <template v-if="fileFilament.weight > 0">
            · {{ $filters.getReadableWeightString(fileFilament.weight) }}
          </template>
        </span>
      </template>
    </v-col>

    <v-col cols="auto">
      <v-icon small>
        $chevronRight
      </v-icon>
    </v-col>

    <!-- Lane name + lane filament -->
    <v-col class="d-flex align-center">
      <v-tooltip
        v-if="laneFilament"
        :disabled="!hasLaneTooltipContent"
        top
        max-width="280"
      >
        <template #activator="{ on, attrs }">
          <span
            class="d-flex align-center"
            v-bind="attrs"
            v-on="on"
          >
            <span
              class="text-subtitle-1 font-weight-bold text-uppercase"
              style="padding-right: 10px;"
            >
              {{ laneName }}
            </span>
            <v-chip
              v-if="laneFilament.color"
              small
              :color="laneFilament.color"
              class="mr-1"
              style="min-width: 0; width: 20px; height: 20px; padding: 0;"
            />
            <span class="text-body-2 text--secondary">
              <template v-if="laneFilament.weight > 0">
                {{ $filters.getReadableWeightString(laneFilament.weight) }}
              </template>
            </span>
          </span>
        </template>
        <div v-if="laneSpool">
          <div>{{ $t('app.afc.PrintStartDialog.SpoolId', { id: laneSpoolId }) }}</div>
          <div>
            {{ laneSpoolVendorName }} — {{ laneSpoolFilamentName }}
          </div>
          <div>
            {{ laneSpool.filament.material || '--' }}
            <template v-if="laneSpool.filament.settings_extruder_temp">
              | {{ laneSpool.filament.settings_extruder_temp }}°C
            </template>
            <template v-if="laneSpool.filament.settings_bed_temp">
              | {{ laneSpool.filament.settings_bed_temp }}°C
            </template>
          </div>
          <div>
            {{ $t('app.afc.PrintStartDialog.SpoolWeightRemaining', {
              remaining: Math.round(laneSpool.remaining_weight ?? 0),
              used: Math.round(laneSpool.used_weight ?? 0)
            }) }}
          </div>
        </div>
        <div v-else>
          <div v-if="laneFilament.material !== '--'">
            {{ laneFilament.material }}
          </div>
          <div v-if="laneFilament.weight > 0">
            {{ $t('app.afc.PrintStartDialog.LaneWeightRemaining', {
              weight: Math.round(laneFilament.weight)
            }) }}
          </div>
        </div>
      </v-tooltip>
      <template v-else>
        <span class="text-subtitle-1 font-weight-bold text-uppercase mr-1">
          {{ $t('app.afc.PrintStartDialog.NoLane') }}
        </span>
      </template>
    </v-col>

    <!-- Lane selector dropdown -->
    <v-col cols="auto">
      <v-menu
        left
        offset-y
      >
        <template #activator="{ on, attrs }">
          <app-btn
            v-bind="attrs"
            icon
            small
            v-on="on"
          >
            <v-icon small>
              $chevronDown
            </v-icon>
          </app-btn>
        </template>
        <v-list dense>
          <v-list-item
            v-for="option in laneOptions"
            :key="option.lane"
            :input-value="option.lane === laneName"
            color="primary"
            @click="changeLaneMapping(option.lane)"
          >
            <v-list-item-content>
              <v-tooltip
                :disabled="!option.hasContent"
                top
                max-width="280"
              >
                <template #activator="{ on, attrs }">
                  <v-list-item-title
                    class="d-flex align-center"
                    v-bind="attrs"
                    v-on="on"
                  >
                    <v-chip
                      v-if="option.color"
                      small
                      :color="option.color"
                      class="mr-2"
                      style="min-width: 0; width: 16px; height: 16px; padding: 0;"
                    />
                    <span class="text-uppercase font-weight-bold mr-2">
                      {{ option.lane }}
                    </span>
                    <span class="text--secondary text-body-2 mr-1">
                      {{ option.material }}
                    </span>
                    <span
                      v-if="option.weight > 0"
                      class="text--secondary text-body-2"
                    >
                      · {{ $filters.getReadableWeightString(option.weight) }}
                    </span>
                    <v-icon
                      v-if="option.lane === laneName"
                      small
                      color="primary"
                      class="ml-2"
                    >
                      $check
                    </v-icon>
                  </v-list-item-title>
                </template>
                <div v-if="option.spoolId != null">
                  <div>
                    {{ $t('app.afc.PrintStartDialog.SpoolId', { id: option.spoolId }) }}
                  </div>
                  <div>
                    {{ option.vendorName }} — {{ option.filamentName }}
                  </div>
                  <div>
                    {{ option.material }}
                    <template v-if="option.extruderTemp">
                      | {{ option.extruderTemp }}°C
                    </template>
                    <template v-if="option.bedTemp">
                      | {{ option.bedTemp }}°C
                    </template>
                  </div>
                  <div>
                    {{ $t('app.afc.PrintStartDialog.SpoolWeightRemaining', {
                      remaining: Math.round(option.weight),
                      used: Math.round(option.usedWeight)
                    }) }}
                  </div>
                </div>
                <div v-else>
                  <div v-if="option.material !== '--'">
                    {{ option.material }}
                  </div>
                  <div v-if="option.weight > 0">
                    {{ $t('app.afc.PrintStartDialog.LaneWeightRemaining', {
                      weight: Math.round(option.weight)
                    }) }}
                  </div>
                </div>
              </v-tooltip>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'
import type { AppFileWithMeta } from '@/store/files/types'
import { encodeGcodeParamValue } from '@/util/gcode-helpers'

interface FilamentInfo {
  color: string
  name: string
  material: string
  weight: number
}

interface LaneOption {
  lane: string
  spoolId: number | null
  color?: string
  material: string
  vendorName: string
  filamentName: string
  extruderTemp?: number
  bedTemp?: number
  weight: number
  usedWeight: number
  hasContent: boolean
}

@Component
export default class AfcPrintStartDialogTool extends Mixins(StateMixin, AfcMixin) {
  @Prop({ type: Object, required: true })
  readonly file!: AppFileWithMeta

  @Prop({ type: Number, required: true })
  readonly toolIndex!: number

  get toolName (): string {
    return `T${this.toolIndex}`
  }

  get fileFilament (): FilamentInfo {
    const fileColors: string[] = this.file.filament_colors ?? []
    const fileNames: string[] = this.file.filament_name ?? []
    const fileTypes: string[] = this.file.filament_type ?? []
    const fileWeights = this.file.filament_weights ?? []

    return {
      color: fileColors[this.toolIndex] ? `#${fileColors[this.toolIndex].replace(/^#/, '')}` : '',
      name: fileNames[this.toolIndex] ?? '--',
      material: fileTypes[this.toolIndex] || '--',
      weight: Number(fileWeights[this.toolIndex] ?? 0)
    }
  }

  get laneName (): string | undefined {
    return this.afcLanes.find(lane => {
      const laneObj = this.getAfcLaneObject(lane)
      const mappedTool = laneObj?.map

      if (Array.isArray(mappedTool)) {
        return mappedTool.some(t => t.toLowerCase() === this.toolName.toLowerCase())
      }

      return mappedTool?.toLowerCase() === this.toolName.toLowerCase()
    })
  }

  get laneSpoolId (): number | undefined {
    if (!this.laneName) return undefined
    return this.getAfcLaneObject(this.laneName)?.spool_id ?? undefined
  }

  get laneSpool () {
    if (!this.laneSpoolId) return null
    return this.$typedGetters['spoolman/getSpoolById'](this.laneSpoolId) ?? null
  }

  get laneSpoolVendorName (): string {
    return this.laneSpool?.filament?.vendor?.name ?? this.$t('app.afc.Unknown') as string
  }

  get laneSpoolFilamentName (): string {
    return this.laneSpool?.filament?.name ?? this.$t('app.afc.Unknown') as string
  }

  get hasLaneTooltipContent (): boolean {
    if (this.laneSpool) return true
    if (!this.laneFilament) return false

    return this.laneFilament.material !== '--' || this.laneFilament.weight > 0
  }

  get laneFilament (): FilamentInfo | undefined {
    if (!this.laneName) return undefined

    const lane = this.getAfcLaneObject(this.laneName)
    const spool = this.laneSpool

    return {
      color: (spool?.filament?.color_hex ? `#${spool.filament.color_hex.replace(/^#/, '')}` : lane?.color) ?? '',
      name: spool?.filament_name ?? '--',
      material: spool?.filament?.material || lane?.material || '--',
      weight: Number(spool?.remaining_weight ?? lane?.weight ?? 0)
    }
  }

  get isFilamentTypeValid (): boolean {
    if (!this.laneFilament) return false
    if (this.fileFilament.material === '--' || this.laneFilament.material === '--') return true

    return this.fileFilament.material.toLowerCase() === this.laneFilament.material.toLowerCase()
  }

  get isFilamentWeightValid (): boolean {
    if (!this.laneFilament) return false
    if (this.fileFilament.weight === 0 || this.laneFilament.weight === 0) return true

    return this.fileFilament.weight <= this.laneFilament.weight
  }

  get warnings (): string[] {
    const warnings: string[] = []

    if (!this.laneName) {
      warnings.push(
        this.$t('app.afc.PrintStartDialog.NoLaneMapped', {
          tool: this.toolName
        }) as string
      )
      return warnings
    }

    if (!this.isFilamentTypeValid) {
      warnings.push(
        this.$t('app.afc.PrintStartDialog.FilamentTypeMismatch', {
          file: this.fileFilament.material,
          lane: this.laneFilament?.material ?? '--'
        }) as string
      )
    }

    if (!this.isFilamentWeightValid) {
      warnings.push(
        this.$t('app.afc.PrintStartDialog.FilamentWeightNotEnough', {
          lane: this.laneName,
          required: this.$filters.getReadableWeightString(this.fileFilament.weight),
          available: this.$filters.getReadableWeightString(this.laneFilament?.weight ?? 0)
        }) as string
      )
    }

    return warnings
  }

  get laneOptions (): LaneOption[] {
    return this.afcLanes.map(lane => {
      const laneObj = this.getAfcLaneObject(lane)
      const spoolId = laneObj?.spool_id ?? undefined
      const spool = spoolId ? (this.$typedGetters['spoolman/getSpoolById'](spoolId) ?? null) : null

      const color = spool?.filament?.color_hex
        ? `#${spool.filament.color_hex.replace(/^#/, '')}`
        : (laneObj?.color ?? undefined)

      const weight = Number(spool?.remaining_weight ?? laneObj?.weight ?? 0)

      const material = spool?.filament?.material || laneObj?.material || '--'
      const hasContent = spool != null || material !== '--' || weight > 0

      return {
        lane,
        spoolId: spool?.id ?? null,
        color,
        material,
        vendorName: spool?.filament?.vendor?.name ?? this.$t('app.afc.Unknown') as string,
        filamentName: spool?.filament?.name ?? this.$t('app.afc.Unknown') as string,
        extruderTemp: spool?.filament?.settings_extruder_temp,
        bedTemp: spool?.filament?.settings_bed_temp,
        weight,
        usedWeight: Number(spool?.used_weight ?? 0),
        hasContent
      }
    })
  }

  changeLaneMapping (lane: string) {
    if (lane === this.laneName) return

    this.sendGcode(
      `SET_MAP LANE=${encodeGcodeParamValue(lane)} MAP=${encodeGcodeParamValue(this.toolName)}`
    )
  }
}
</script>
