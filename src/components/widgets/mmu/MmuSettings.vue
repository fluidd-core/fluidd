<template>
    <v-menu bottom left offset-y transition="slide-y-transition" :close-on-content-click="false">
        <template #activator="{ on, attrs }">
            <app-btn icon v-bind="attrs" v-on="on">
                <v-icon dense>$cog</v-icon>
            </app-btn>
        </template>
        <v-list>
            <v-list-item v-if="hasEncoder" class="minHeight36">
                <v-checkbox
                    v-model="showClogDetection"
                    class="mt-0"
                    hide-details
                    :label="$t('app.mmu.setting.show_clog_detection')" />
            </v-list-item>
            <v-list-item class="minHeight36">
                <v-checkbox
                    v-model="showTtgMap"
                    class="mt-0"
                    hide-details
                    :label="$t('app.mmu.setting.show_ttg_map')" />
            </v-list-item>
            <v-list-item class="minHeight36">
                <v-checkbox
                    v-model="showDetails"
                    class="mt-0"
                    hide-details
                    :label="$t('app.mmu.setting.show_details')" />
            </v-list-item>
            <v-list-item class="minHeight36">
                <v-checkbox
                    v-model="largeFilamentStatus"
                    class="mt-0"
                    hide-details
                    :label="$t('app.mmu.setting.large_filament_status')" />
            </v-list-item>
            <v-list-item class="minHeight36">
                <v-checkbox
                    v-model="showLogos"
                    class="mt-0"
                    hide-details
                    :label="$t('app.mmu.setting.show_logos')" />
            </v-list-item>
        </v-list>
    </v-menu>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import MmuMixin from '@/mixins/mmu'

@Component({})
export default class MmuSettings extends Mixins(StateMixin, MmuMixin) {

    get showClogDetection(): boolean {
        return this.$store.state.config.uiSettings.mmu.showClogDetection
    }

    set showClogDetection(value: boolean) {
        this.$store.dispatch('config/saveByPath', {
            path: 'uiSettings.mmu.showClogDetection',
            value,
            server: true
        })
    }

    get showTtgMap(): boolean {
        return this.$store.state.config.uiSettings.mmu.showTtgMap
    }

    set showTtgMap(value: boolean) {
        this.$store.dispatch('config/saveByPath', {
            path: 'uiSettings.mmu.showTtgMap',
            value,
            server: true
        })
    }

    get showDetails(): boolean {
        return this.$store.state.config.uiSettings.mmu.showDetails
    }

    set showDetails(value: boolean) {
        this.$store.dispatch('config/saveByPath', {
            path: 'uiSettings.mmu.showDetails',
            value,
            server: true
        })
    }

    get largeFilamentStatus(): boolean {
        return this.$store.state.config.uiSettings.mmu.largeFilamentStatus
    }

    set largeFilamentStatus(value: boolean) {
        this.$store.dispatch('config/saveByPath', {
            path: 'uiSettings.mmu.largeFilamentStatus',
            value,
            server: true
        })
    }

    get showLogos(): boolean {
        return this.$store.state.config.uiSettings.mmu.showLogos
    }

    set showLogos(value: boolean) {
        this.$store.dispatch('config/saveByPath', {
            path: 'uiSettings.mmu.showLogos',
            value,
            server: true
        })
    }
}
</script>

<style scoped></style>
