<template>
  <app-dialog
    v-model="open"
    :title="'commits_behind' in component ? $t('app.version.label.commit_history'): $t('app.version.label.package_list')"
    max-width="850"
    no-actions
  >
    <v-card-text
      v-if="'commits_behind' in component && commitHistory"
      class="py-0 pl-0"
    >
      <!-- History Items. -->
      <v-timeline
        align-top
        dense
      >
        <v-timeline-item
          v-for="(key) in commitHistory.keys"
          :key="`key-${key}`"
          color="transparent"
          small
        >
          <template #icon>
            <v-icon
              class="rotate-90"
              color="secondary"
            >
              $commit
            </v-icon>
          </template>

          <div class="secondary--text mb-4">
            {{ $t('app.version.label.commits_on') }} {{ $filters.formatDate(key) }}
          </div>

          <ol class="commit-history">
            <template v-for="commit in commitHistory.result[key]">
              <li
                :key="commit.sha"
              >
                <div>
                  <div class="commit-subject">
                    {{ commit.subject }}
                  </div>
                  <div class="secondary--text">
                    <!-- https://github.com/Klipper3D/klipper/commits?author=KevinOConnor -->
                    <a
                      class="secondary--text"
                      :href="`${baseUrl}/commits/${component.branch}`"
                      target="_blank"
                    >
                      <strong>{{ commit.author }}</strong>
                    </a>
                    {{ $t('app.version.label.committed') }} {{ $filters.formatRelativeTimeToNow(commit.date * 1000) }}
                  </div>
                </div>
                <div>
                  <app-btn
                    small
                    outlined
                    color="secondary"
                    :href="`${baseUrl}/commit/${commit.sha}`"
                    target="_blank"
                  >
                    <span class="primary--text">{{ commit.sha.substring(0, 7) }}</span>
                  </app-btn>
                </div>
              </li>
            </template>
          </ol>
        </v-timeline-item>
      </v-timeline>
    </v-card-text>

    <v-card-text
      v-if="'package_list' in component"
      class="pt-4"
    >
      <!-- OS Packages -->
      <div class="chip-group">
        <v-chip
          v-for="chip in component.package_list"
          :key="chip"
          small
        >
          {{ chip }}
        </v-chip>
      </div>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import type { UpdatePackage } from '@/store/version/types'
import { Component, Vue, Prop, VModel } from 'vue-property-decorator'

@Component({})
export default class VersionInformationDialog extends Vue {
  @VModel({ type: Boolean })
    open?: boolean

  @Prop({ type: Object })
  readonly component!: UpdatePackage

  // For HashVersions or ArtifacVersions, show the commit history.
  // For type system, show the packages available to update.
  // For type client, just show the release notes if we can.

  get commitHistory () {
    return this.$store.getters['version/getCommitHistory'](this.component.key)
  }

  get baseUrl () {
    if ('owner' in this.component) {
      return `https://github.com/${this.component.owner}/${this.component.repo_name || this.component.key}`
    }
    return ''
  }
}
</script>

<style lang="scss" scoped>
  @import 'vuetify/src/styles/styles.sass';

  ol.commit-history {
    margin: 0;
    padding: 0;
    list-style-type: none;
    border: thin solid rgba(map-get($shades, 'white'), 0.12);
    border-radius: 6px;

    li {
      padding: 8px 16px;
      border-bottom: thin solid rgba(map-get($shades, 'white'), 0.12);
      display: flex;
      flex: 1 0 auto;
      justify-content: space-between;
      align-items: center;

      &:hover {
        background-color: rgba(map-get($shades, 'white'), 0.025)
      }

      // div.commit-subject {
        // max-width: 350px;
        // overflow: hidden;
        // white-space: nowrap;
        // text-overflow: ellipsis;
      // }

      &:last-child {
        border: none;
      }
    }
  }
  .commit-table {
    border-bottom: thin solid rgba(map-get($shades, 'white'), 0.12);
    border-radius: 6px;
  }

  :deep(.v-timeline-item__dot) {
    box-shadow: none !important;
  }
</style>
