<template>
  <collapsable-card
    v-if="roots.length > 0"
    :title="$t('app.file_system.label.diskinfo')"
    icon="$harddisk"
  >
    <v-toolbar dense>
      <v-tabs
        v-model="tab"
        show-arrows
      >
        <v-tab
          v-for="(root, index) in roots"
          :key="index"
        >
          {{ root }}
        </v-tab>
      </v-tabs>

      <v-spacer />

      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <app-btn
            v-bind="attrs"
            icon
            :disabled="!diskUsage || loading"
            @click.prevent.stop="handleRefresh()"
            v-on="on"
          >
            <v-icon
              dense
              :class="{ 'spin-alt': loading }"
            >
              $refresh
            </v-icon>
          </app-btn>
        </template>
        <span>{{ $t('app.general.btn.refresh') }}</span>
      </v-tooltip>
    </v-toolbar>

    <v-card-text>
      <v-layout justify-space-between>
        <div>
          {{ $t('app.file_system.label.disk_usage') }}
        </div>
      </v-layout>

      <v-progress-linear
        :size="90"
        :height="10"
        :value="diskUsage?.usedPercent"
        :color="diskUsage?.lowOnSpace ? 'error': 'primary'"
        class="my-1"
      />

      <v-layout justify-space-between>
        <div>
          <span class="focus--text">
            {{
              diskUsage != null
                ? $filters.getReadableFileSizeString(diskUsage.used)
                : '?'
            }}
          </span>
          <span class="secondary--text">{{ $t('app.general.label.used') }}</span>
        </div>
        <div>
          <span class="focus--text">
            {{
              diskUsage != null
                ? $filters.getReadableFileSizeString(diskUsage.free)
                : '?'
            }}
          </span>
          <span class="secondary--text">{{ $t('app.general.label.free') }}</span>
        </div>
      </v-layout>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import type { AppDiskUsage } from '@/store/files/types'
import { SocketActions } from '@/api/socketActions'
import StateMixin from '@/mixins/state'

@Component({})
export default class DiskUsageCard extends Mixins(StateMixin) {
  tab: number | null = null

  get roots (): string[] {
    return this.$typedState.server.info.registered_directories
  }

  get currentRoot (): string | null {
    return this.tab != null
      ? this.roots[this.tab] ?? null
      : null
  }

  get loading (): boolean {
    return this.hasWait(`${this.$waits.onFileSystem}/${this.currentRoot}/`)
  }

  get diskUsage (): AppDiskUsage | undefined {
    if (this.currentRoot != null) {
      const diskUsage: AppDiskUsage | undefined = this.$typedGetters['files/getDiskUsage'](this.currentRoot)

      if (diskUsage == null) {
        SocketActions.serverFilesGetDirectory(this.currentRoot)
      }

      return diskUsage
    }
  }

  handleRefresh () {
    if (this.currentRoot != null) {
      SocketActions.serverFilesGetDirectory(this.currentRoot)
    }
  }
}
</script>
