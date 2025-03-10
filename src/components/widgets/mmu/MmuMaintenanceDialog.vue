<template>
    <app-dialog v-model="showDialog"
                width="600" persistent title-shadow
                :fullscreen="isMobileViewport"
                :title="$t('app.mmu.title.mmu_maintenance')">

            <v-card-subtitle>
                {{ $t('app.mmu.msg.maintenance_intro') }}
            </v-card-subtitle>

            <v-card-text>
                <v-row dense>
                    <v-col class="col-6 d-flex justify-center align-center">
                        <span class="settings-row-title">
                            {{ $t('app.mmu.label.motor_sync') }}
                        </span>
                    </v-col>
                    <v-col class="col-3 d-flex justify-center">
                        <v-btn
                            block
                            small
                            :disabled="!canSend || syncDrive"
                            class="btn-small-text"
                            color="secondary"
                            @click="sendGcode('MMU_SYNC_GEAR_MOTOR SYNC=1', $waits.onMmuSyncGearMotor)">
                            <v-icon left>{{ mdiSync }}</v-icon>
                            {{ $t('app.mmu.btn.sync') }}
                        </v-btn>
                    </v-col>
                    <v-col class="col-3 d-flex justify-center">
                        <v-btn
                            block
                            small
                            :disabled="!canSend || !syncDrive"
                            class="btn-small-text"
                            color="secondary"
                            @click="sendGcode('MMU_SYNC_GEAR_MOTOR SYNC=0', $waits.onMmuSyncGearMotor)">
                            <v-icon left>{{ mdiSyncOff }}</v-icon>
                            {{ $t('app.mmu.btn.unsync') }}
                        </v-btn>
                    </v-col>
                </v-row>
                <v-row dense>
                    <v-col class="col-6 d-flex justify-center align-center">
                        <span class="settings-row-title">
                            {{ $t('app.mmu.label.extruder_only') }}
                        </span>
                    </v-col>
                    <v-col class="col-3 d-flex justify-center">
                        <v-btn
                            block
                            small
                            :disabled="!canSend"
                            class="btn-small-text"
                            color="secondary"
                            @click="sendGcode('MMU_LOAD EXTRUDER_ONLY=1', $waits.onMmuLoad)">
                            <v-icon left>{{ mdiDownloadOutline }}</v-icon>
                            {{ $t('app.mmu.btn.load') }}
                        </v-btn>
                    </v-col>
                    <v-col class="col-3 d-flex justify-center">
                        <v-btn
                            block
                            small
                            :disabled="!canSend"
                            class="btn-small-text"
                            color="secondary"
                            @click="sendGcode('MMU_UNLOAD EXTRUDER_ONLY=1', $waits.onMmuUnload)">
                            <v-icon left>{{ mdiUploadOutline }}</v-icon>
                            {{ $t('app.mmu.btn.unload') }}
                        </v-btn>
                    </v-col>
                </v-row>

                <v-row dense>
                    <v-col class="col-6 d-flex justify-center">
                        <span class="settings-row-title">
                            {{ $t('app.mmu.label.mmu_motors') }}
                        </span>
                    </v-col>
                    <v-col class="col-3 d-flex justify-center">
                        <v-btn
                            block
                            small
                            :disabled="!canSend"
                            class="btn-small-text"
                            color="secondary"
                            @click="sendGcode('MMU_MOTORS_ON', $waits.onMmuMotorsOn)">
                            <v-icon left>{{ mdiEngineOutline }}</v-icon>
                            {{ $t('app.mmu.btn.on') }}
                        </v-btn>
                    </v-col>
                    <v-col class="col-3 d-flex justify-center">
                        <v-btn
                            block
                            small
                            :disabled="!canSend"
                            class="btn-small-text"
                            color="secondary"
                            @click="sendGcode('MMU_MOTORS_OFF', $waits.onMmuMotorsOff)">
                            <v-icon left>{{ mdiEngineOffOutline }}</v-icon>
                            {{ $t('app.mmu.btn.off') }}
                        </v-btn>
                    </v-col>
                </v-row>

                <!-- PER MMU UNIT CUSTOM CONTROLS -->
                <div v-for="index in unitArray" :key="'unit_' + index">
                    <v-row dense>
                        <v-col cols="12" class="pt-6">
                            <span class="settings-row-subtitle">{{ unitDisplayName(index) }}</span>
                            <v-divider class="mb-1" />
                        </v-col>
                    </v-row>

                    <v-row v-if="['RotarySelector', 'ServoSelector'].includes(unitDetails(index).selectorType)" dense>
                        <v-col cols="3" class="d-flex align-center">
                            <span class="settings-row-title">
                                {{ $t('app.mmu.label.selector') }}
                            </span>
                        </v-col>
                        <v-col class="col-9">
                            <v-row dense>
                                <v-col cols="4" class="d-flex align-center">
                                    <v-btn
                                        block
                                        small
                                        :disabled="!canSend"
                                        class="btn-small-text"
                                        color="secondary"
                                        @click="sendGcode('MMU_HOME', $waits.onMmuHome)">
                                        <v-icon left>{{ mdiHomeOutline }}</v-icon>
                                        {{ $t('app.mmu.btn.home') }}
                                    </v-btn>
                                </v-col>
                            </v-row>
                            <v-row dense>
                                <v-col class="col-4 d-flex justify-center">
                                    <v-btn
                                        block
                                        small
                                        :disabled="!canSend || grip === 'Gripped'"
                                        class="btn-small-text"
                                        color="secondary"
                                        @click="sendGcode('MMU_GRIP', $waits.onMmuGrip)">
                                        <v-icon left>{{ mdiArrowCollapseHorizontal }}</v-icon>
                                        {{ $t('app.mmu.btn.grip') }}
                                    </v-btn>
                                </v-col>
                                <v-col class="col-4 d-flex justify-center">
                                    <v-btn
                                        block
                                        small
                                        :disabled="!canSend || grip === 'Released'"
                                        class="btn-small-text"
                                        color="secondary"
                                        @click="sendGcode('MMU_RELEASE', $waits.onMmuRelease)">
                                        <v-icon left>{{ mdiArrowExpandHorizontal }}</v-icon>
                                        {{ $t('app.mmu.btn.release') }}
                                    </v-btn>
                                </v-col>
                            </v-row>
                        </v-col>
                    </v-row>

                    <v-row v-else-if="['LinearSelector'].includes(unitDetails(index).selectorType)" dense>
                        <v-col cols="3" class="d-flex align-center">
                            <span class="settings-row-title">
                                {{ $t('app.mmu.label.selector') }}
                            </span>
                        </v-col>
                        <v-col class="col-9">
                            <v-row dense>
                                <v-col cols="4" class="d-flex align-center">
                                    <v-btn
                                        block
                                        small
                                        :disabled="!canSend"
                                        class="btn-small-text"
                                        color="secondary"
                                        @click="sendGcode('MMU_HOME', $waits.onMmuHome)">
                                        <v-icon left>{{ mdiHomeOutline }}</v-icon>
                                        {{ $t('app.mmu.btn.home') }}
                                    </v-btn>
                                </v-col>
                            </v-row>
                            <v-row dense>
                                <v-col class="col-4 d-flex justify-center">
                                    <v-btn
                                        block
                                        small
                                        :disabled="!canSend || servo === 'Up'"
                                        class="btn-small-text"
                                        color="secondary"
                                        @click="sendGcode('MMU_SERVO POS=up', $waits.onMmuServo)">
                                        <v-icon left>{{ mdiArrowUpThin }}</v-icon>
                                        {{ $t('app.mmu.btn.up') }}
                                    </v-btn>
                                </v-col>
                                <v-col class="col-4 d-flex justify-center">
                                    <v-btn
                                        block
                                        small
                                        :disabled="!canSend || servo === 'Down'"
                                        class="btn-small-text"
                                        color="secondary"
                                        @click="sendGcode('MMU_SERVO POS=down', $waits.onMmuServo)">
                                        <v-icon left>{{ mdiArrowDownThin }}</v-icon>
                                        {{ $t('app.mmu.btn.down') }}
                                    </v-btn>
                                </v-col>
                                <v-col class="col-4 d-flex justify-center">
                                    <v-btn
                                        block
                                        small
                                        :disabled="!canSend || servo === 'Move'"
                                        class="btn-small-text"
                                        color="secondary"
                                        @click="sendGcode('MMU_SERVO POS=move', $waits.onMmuServo)">
                                        <v-icon left>{{ mdiArrowLeftRight }}</v-icon>
                                        {{ $t('app.mmu.btn.move') }}
                                    </v-btn>
                                </v-col>
                            </v-row>
                        </v-col>
                    </v-row>

                    <v-row v-else dense>
                        <v-col cols="3" class="d-flex align-center">
                            <span class="settings-row-subtitle">
                                {{ $t('app.mmu.msg.no_custom_controls') }}
                            </span>
                        </v-col>
                    </v-row>
                </div>

                <v-row dense>
                    <v-col cols="12" class="pt-10">
                        <span class="settings-row-subtitle">
                            {{ $t('app.mmu.label.config') }}
                        </span>
                        <v-divider class="mb-6 mt-1" />
                    </v-col>
                </v-row>

                <v-row dense>
                    <v-col cols="3" class="d-flex align-center">
                        <v-col class="d-flex flex-column pa-0 my-3">
                            <span class="settings-row-title">
                                {{ $t('app.mmu.label.leds') }}
                            </span>
                            <v-switch
                                v-model="localLedEnable"
                                :disabled="!mmuLeds"
                                :label="$t('app.mmu.label.enable')"
                                hide-details
                                class="short-switch" />
                            <v-switch
                                v-model="localLedAnimation"
                                :disabled="!ledEffectModule"
                                :label="$t('app.mmu.label.animation')"
                                hide-details
                                class="short-switch" />
                        </v-col>
                    </v-col>
                    <v-col cols="7">
                        <v-row dense :class="{ 'disabled-row': !hasLedsOfType('entry') }">
                            <v-col class="col-4 d-flex justify-end align-center pr-6">Entry</v-col>
                            <v-col class="col-8 d-flex align-center">
                                <v-select
                                    :items="LED_OPTIONS"
                                    :disabled="!hasLedsOfType('entry')"
                                    v-model="localEntryEffect"
                                    hide-details
                                    outlined
                                    dense />
                            </v-col>
                        </v-row>
                        <v-row dense :class="{ 'disabled-row': !hasLedsOfType('exit') }">
                            <v-col class="col-4 d-flex justify-end align-center pr-6">Exit</v-col>
                            <v-col class="col-8 d-flex align-center">
                                <v-select
                                    :items="LED_OPTIONS"
                                    :disabled="!hasLedsOfType('exit')"
                                    v-model="localExitEffect"
                                    hide-details
                                    outlined
                                    dense />
                            </v-col>
                        </v-row>
                        <v-row dense :class="{ 'disabled-row': !hasLedsOfType('status') }">
                            <v-col class="col-4 d-flex justify-end align-center pr-6">Status</v-col>
                            <v-col class="col-8 d-flex align-center">
                                <v-select
                                    :items="LED_STATUS_OPTIONS"
                                    :disabled="!hasLedsOfType('status')"
                                    v-model="localStatusEffect"
                                    hide-details
                                    outlined
                                    dense />
                            </v-col>
                        </v-row>
                    </v-col>
                    <v-col cols="2" class="d-flex align-center justify-center">
                        <v-btn class="btn-no-text" color="secondary"
                               :disabled="!canSend"
                               :loading="hasWait($waits.onMmuLed)"
                               @click="updateLeds">
                            <v-icon>{{ mdiContentSaveSettingsOutline }}</v-icon>
                        </v-btn>
                    </v-col>
                </v-row>

                <v-row dense class="mt-4">
                    <v-col cols="3" class="d-flex align-center">
                        <span class="settings-row-title">
                            {{ $t('app.mmu.label.ui_visual') }}
                        </span>
                    </v-col>
                    <v-col cols="7">
                        <v-row dense>
                            <v-col class="col-4 d-flex justify-end align-center pr-6">
                                {{ $t('app.mmu.label.extruder_tx') }}
                            </v-col>
                            <v-col class="col-8 d-flex align-center">
                                <v-select
                                    :items="T_MACRO_COLOR_OPTIONS"
                                    v-model="localTMacroColor"
                                    hide-details
                                    outlined
                                    dense />
                            </v-col>
                        </v-row>
                    </v-col>
                </v-row>
            </v-card-text>

            <template #actions>
                <v-spacer />
                <app-btn color="primary" @click="close" >
                    {{ $t('app.mmu.label.ok') }}
                </app-btn>
            </template>

    </app-dialog>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins, Prop, Watch } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import StateMixin from '@/mixins/state'
import MmuMixin from '@/mixins/mmu'
import {
    mdiCloseThick,
    mdiSync,
    mdiSyncOff,
    mdiDownloadOutline,
    mdiUploadOutline,
    mdiEngineOutline,
    mdiEngineOffOutline,
    mdiHomeOutline,
    mdiArrowDownThin,
    mdiArrowUpThin,
    mdiArrowLeftRight,
    mdiArrowCollapseHorizontal,
    mdiArrowExpandHorizontal,
    mdiContentSaveSettingsOutline,
} from '@mdi/js'

@Component({
    components: { },
})
export default class MmuMaintainanceStateDialog extends Mixins(BrowserMixin, StateMixin, MmuMixin) {
    mdiCloseThick = mdiCloseThick
    mdiSync = mdiSync
    mdiSyncOff = mdiSyncOff
    mdiDownloadOutline = mdiDownloadOutline
    mdiUploadOutline = mdiUploadOutline
    mdiEngineOutline = mdiEngineOutline
    mdiEngineOffOutline = mdiEngineOffOutline
    mdiHomeOutline = mdiHomeOutline
    mdiArrowDownThin = mdiArrowDownThin
    mdiArrowUpThin = mdiArrowUpThin
    mdiArrowLeftRight = mdiArrowLeftRight
    mdiArrowCollapseHorizontal = mdiArrowCollapseHorizontal
    mdiArrowExpandHorizontal = mdiArrowExpandHorizontal
    mdiContentSaveSettingsOutline = mdiContentSaveSettingsOutline

    @Prop({ required: true }) readonly showDialog!: boolean

    private localLedEnable: boolean = true
    private localLedAnimation: boolean = true
    private localEntryEffect: string = 'off'
    private localExitEffect: string = 'off'
    private localStatusEffect: string = 'off'
    private localTMacroColor: string = 'slicer'

    @Watch('showDialog')
    onShowDialogChanged(newValue: boolean): void {
        if (newValue) {
            this.localLedEnable = this.macroVarsLedEnable
            this.localLedAnimation = this.macroVarsLedAnimation
            this.localEntryEffect = this.macroVarsDefaultEntryEffect
            this.localExitEffect = this.macroVarsDefaultExitEffect
            this.localStatusEffect = this.macroVarsDefaultStatusEffect
            this.localTMacroColor = this.configTMacroColor
        }
    }

    get unitArray(): number[] {
        return Array.from({ length: this.numUnits }, (_, k) => k)
    }

    get mmuLeds(): boolean {
        return !!this.$store.state.printer.printer.mmu_leds
    }

    private hasLedsOfType(type: string): boolean {
        return (this.$store.state.printer.printer.mmu_leds?.[type] ?? 0) > 0
    }

    get ledEffectModule(): boolean {
        return this.$store.state.printer.printer.mmu_leds?.led_effect_module ?? false
    }

    private unitDisplayName(unit: number): string {
        const name = this.unitDetails(unit).name
        return `MMU #${unit + 1} - ${name}`
    }

    private updateLeds() {
        const command: string = `
            MMU_LED QUIET=1
            ENABLE=${this.localLedEnable ? 1 : 0}
            ANIMATION=${this.localLedAnimation ? 1 : 0}
            ENTRY_EFFECT=${this.localEntryEffect}
            EXIT_EFFECT=${this.localExitEffect}
            STATUS_EFFECT=${this.localStatusEffect}
        `
            .replace(/\s+/g, ' ')
            .trim()
        this.sendGcode(command, this.$waits.onMmuLed)

        this.updateTMacroColor()
    }

    private updateTMacroColor() {
        const command: string = `MMU_TEST_CONFIG QUIET=1 t_macro_color=${this.localTMacroColor}`
        this.sendGcode(command, this.$waits.onMmuTestConfig)
    }

    close() {
        this.$emit('close')
    }
}
</script>

<style scoped>
.settings-row-title {
    display: block;
    width: 100%;
    font-weight: bold;
}

.settings-row-subtitle {
    display: block;
    font-size: 0.8em;
    line-height: 1.3;
    margin-top: 3px;
}

.short-switch {
    padding-top: 4px;
    margin-top: 2px;
    margin-bottom: 4px;
}

::v-deep .short-switch .v-label {
    font-size: 0.8em;
}

.btn-small-text {
    font-size: 0.8em;
}

.btn-small-text .v-icon {
    margin-right: 4px;
}

.btn-no-text {
    height: 50% !important;
}

.btn-no-text .v-icon {
    margin-right: 0;
}

.disabled-row {
    opacity: 0.5;
}
</style>
