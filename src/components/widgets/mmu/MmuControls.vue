<template>
  <v-container class="d-flex flex-column">
    <v-row dense>
      <v-col cols="6">
        <v-tooltip
          top
          color="secondary"
        >
          <template #activator="{ on }">
            <v-btn
              ref="refBtn"
              block
              small
              :class="btnClass"
              :disabled="!canSend || [GATE_AVAILABLE, GATE_AVAILABLE_FROM_BUFFER].includes(currentGateStatus)"
              :loading="hasWait($waits.onMmuPreload)"
              v-on="showTooltip ? on : {}"
              @click="sendGcode('MMU_PRELOAD', $waits.onMmuPreload)"
            >
              <v-icon left>
                {{ mdiDownloadOutline }}
              </v-icon>
              {{ $t('app.mmu.btn.preload') }}
            </v-btn>
          </template>
          {{ $t('app.mmu.btn.preload') }}
        </v-tooltip>
      </v-col>
      <v-col cols="6">
        <v-tooltip
          top
          color="secondary"
        >
          <template #activator="{ on }">
            <v-btn
              block
              small
              :class="btnClass"
              :disabled="!canSend || [GATE_EMPTY].includes(currentGateStatus)"
              :loading="hasWait($waits.onMmuEject)"
              v-on="showTooltip ? on : {}"
              @click="sendGcode('MMU_EJECT', $waits.onMmuEject)"
            >
              <v-icon left>
                {{ mdiEject }}
              </v-icon>
              {{ $t('app.mmu.btn.eject') }}
            </v-btn>
          </template>
          {{ $t('app.mmu.btn.eject') }}
        </v-tooltip>
      </v-col>
    </v-row>
    <v-row dense>
      <v-col cols="6">
        <v-tooltip
          top
          color="secondary"
        >
          <template #activator="{ on }">
            <v-btn
              block
              small
              :class="btnClass"
              :disabled="!canSend"
              :loading="hasWait($waits.onMmuCheckGate)"
              v-on="showTooltip ? on : {}"
              @click="sendGcode('MMU_CHECK_GATE', $waits.onMmuCheckGate)"
            >
              <v-icon left>
                {{ mdiCheck }}
              </v-icon>
              {{ $t('app.mmu.btn.check_gate') }}
            </v-btn>
          </template>
          {{ $t('app.mmu.btn.check_gate') }}
        </v-tooltip>
      </v-col>
      <v-col cols="6">
        <v-tooltip
          top
          color="secondary"
        >
          <template #activator="{ on }">
            <v-btn
              block
              small
              :class="btnClass"
              :disabled="!canSend"
              :loading="hasWait($waits.onMmuRecover)"
              v-on="showTooltip ? on : {}"
              @click="sendGcode('MMU_RECOVER', $waits.onMmuRecover)"
            >
              <v-icon left>
                {{ mdiAutoFix }}
              </v-icon>
              {{ $t('app.mmu.btn.recover') }}
            </v-btn>
          </template>
          {{ $t('app.mmu.btn.recover') }}
        </v-tooltip>
      </v-col>
    </v-row>
    <v-row dense>
      <v-col cols="2" />
      <v-col cols="8">
        <v-tooltip
          top
          color="secondary"
        >
          <template #activator="{ on }">
            <v-btn
              block
              small
              :class="btnClass"
              :disabled="!canSend || !isMmuPausedAndLocked"
              :loading="hasWait($waits.onMmuUnload)"
              v-on="showTooltip ? on : {}"
              @click="sendGcode('MMU_UNLOCK', $waits.onMmuUnload)"
            >
              <v-icon left>
                {{ mdiThermometerPlus }}
              </v-icon>
              {{ $t('app.mmu.btn.unlock') }}
            </v-btn>
          </template>
          {{ $t('app.mmu.btn.unlock') }}
        </v-tooltip>
      </v-col>
      <v-col cols="2" />
    </v-row>
    <v-row>
      <v-col cols="6">
        <v-tooltip
          top
          color="secondary"
        >
          <template #activator="{ on }">
            <v-btn
              large
              block
              class="wrap-text-btn"
              :class="btnClass"
              :disabled="!canSend || filamentPos === FILAMENT_POS_UNLOADED"
              :loading="hasWait($waits.onMmuUnload)"
              v-on="showTooltip ? on : {}"
              @click="sendGcode('MMU_UNLOAD', $waits.onMmuUnload)"
            >
              <v-icon left>
                {{ mdiUpload }}
              </v-icon>
              {{ unloadButtonText }}
            </v-btn>
          </template>
          {{ unloadButtonText }}
        </v-tooltip>
      </v-col>
      <v-col cols="6">
        <v-tooltip
          top
          color="secondary"
        >
          <template #activator="{ on }">
            <v-btn
              large
              block
              class="wrap-text-btn"
              :class="btnClass"
              :disabled="!canSend || filamentPos !== FILAMENT_POS_UNLOADED"
              :loading="hasWait($waits.onMmuLoad)"
              v-on="showTooltip ? on : {}"
              @click="sendGcode('MMU_LOAD', $waits.onMmuLoad)"
            >
              <v-icon left>
                {{ mdiDownload }}
              </v-icon>
              {{ loadButtonText }}
            </v-btn>
          </template>
          {{ loadButtonText }}
        </v-tooltip>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { Debounce } from 'vue-debounce-decorator'
import { VBtn } from 'vuetify/lib'
import StateMixin from '@/mixins/state'
import MmuMixin from '@/mixins/mmu'
import { mdiDownloadOutline, mdiEject, mdiCheck, mdiAutoFix, mdiThermometerPlus, mdiDownload, mdiUpload } from '@mdi/js'

@Component({})
export default class MmuControls extends Mixins(StateMixin, MmuMixin) {
  mdiDownloadOutline = mdiDownloadOutline
  mdiEject = mdiEject
  mdiCheck = mdiCheck
  mdiAutoFix = mdiAutoFix
  mdiThermometerPlus = mdiThermometerPlus
  mdiUpload = mdiUpload
  mdiDownload = mdiDownload

  private btnSize: number = 2

  get unloadButtonText () {
    if (this.gate === this.TOOL_GATE_BYPASS) return this.$t('app.mmu.btn.unload_ext')
    return this.$t('app.mmu.btn.unload')
  }

  get loadButtonText () {
    if (this.gate === this.TOOL_GATE_BYPASS) return this.$t('app.mmu.btn.load_ext')
    return this.$t('app.mmu.btn.load')
  }

  @Debounce(500)
  checkButtonWidth () {
    this.$nextTick(() => {
      const btn = this.$refs.refBtn as InstanceType<typeof VBtn>
      if (btn) {
        const width = (btn.$el as HTMLElement).offsetWidth ?? 0
        if (width === 0) {
          this.btnSize = 2
        } else if (width < 95) {
          this.btnSize = 0
        } else if (width < 120) {
          this.btnSize = 1
        } else {
          this.btnSize = 2
        }
      }
    })
  }

  get btnClass (): string[] {
    const classes = ['base-btn']
    if (this.btnSize === 0) {
      classes.push('btn-no-text')
    } else if (this.btnSize === 1) {
      classes.push('btn-small-text')
    }
    return classes
  }

  get showTooltip (): boolean {
    return this.btnSize === 0
  }

  get currentGateStatus (): number {
    return this.$typedState.printer.printer.mmu?.gate_status?.[this.gate] ?? -1
  }

  @Watch('$typedState.gui.view.mmu.largeFilamentStatus')
  onFilamentStatusSizeChange (): void {
    this.checkButtonWidth()
  }

  mounted () {
    this.checkButtonWidth()
    window.addEventListener('resize', this.checkButtonWidth)
  }

  beforeDestroy () {
    window.removeEventListener('resize', this.checkButtonWidth)
  }
}
</script>

<style scoped>
.base-btn {
    max-width: 100%;
    overflow: hidden;
}

.wrap-text-btn {
    min-height: 3em;
    display: inline-block;
    white-space: normal;
}

.btn-small-text {
    font-size: 0.6em;
}

.btn-small-text .v-icon {
    margin-right: 2px;
}

.btn-no-text {
    font-size: 0;
}

.btn-no-text .v-icon {
    margin-right: 0;
}
</style>
