<template>
  <v-dialog
    :value="value"
    @input="$emit('input', $event)"
    :max-width="850"
    scrollable
  >
    <v-card v-if="component">
      <v-card-title class="card-heading py-2">
        <span class="focus--text" v-if="'commits_behind' in component">Commit History</span>
        <span class="focus--text" v-else>Package List</span>

        <v-spacer />
        <app-btn
          color=""
          icon
          @click="$emit('input', false)"
        >
          <v-icon>$close</v-icon>
        </app-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="py-0 pl-0" v-if="commitHistory">

        <!-- History Items. -->
        <template>
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
              <template v-slot:icon>
                <v-icon class="rotate-90" color="secondary">$commit</v-icon>
              </template>

              <div class="secondary--text mb-4">
                Commits on {{ $dayjs(key).format('ll') }}
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
                      <!-- https://github.com/KevinOConnor/klipper/commits?author=KevinOConnor -->
                      <a
                         class="secondary--text"
                        :href="`${baseUrl}/commits/${component.branch}`"
                        target="_blank"
                      >
                        <strong>{{ commit.author }}</strong>
                      </a>
                      commited {{ $dayjs(commit.date).fromNow() }}
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

        </template>

      </v-card-text>

      <v-card-text
        class="pt-4"
        v-if="component.package_list"
      >
        <!-- OS Packages -->
        <div class="chip-group">
          <v-chip
            small
            v-for="chip in component.package_list"
            :key="chip"
          >
            {{ chip }}
          </v-chip>
        </div>
      </v-card-text>

    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { ArtifactVersion, HashVersion, OSPackage } from '@/store/version/types'
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class VersionInformationDialog extends Vue {
  @Prop({ type: Boolean, required: true })
  value!: boolean

  @Prop({ type: Object })
  component!: HashVersion | ArtifactVersion | OSPackage

  // For HashVersions or ArtifacVersions, show the commit history.
  // For type system, show the packages available to update.
  // For type client, just show the release notes if we can.

  get commitHistory () {
    return this.$store.getters['version/getCommitHistory'](this.component.key)
  }

  get baseUrl () {
    if ('owner' in this.component) {
      return `https://github.com/${this.component.owner}/${this.component.key}`
    }
    return ''
  }
}
</script>

<style lang="scss" scoped>
  @import '~vuetify/src/styles/styles.sass';
  // @import '~vuetify/src/components/VStepper/_variables.scss';

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
    border: solid 1px #ccc;
    border-radius: 6px;
  }

  ::v-deep .v-timeline-item__dot {
    box-shadow: none !important;
  }
</style>
