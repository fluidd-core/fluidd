<template>
  <collapsable-card
    :title="$t('app.database.label.moonraker_database')"
    icon="$database"
  >
    <v-simple-table>
      <thead>
        <tr>
          <th>{{ $t('app.general.label.name') }}</th>
          <th>&nbsp;</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in backups"
          :key="item"
        >
          <td>{{ item }}</td>
          <td
            class="text-right"
            nowrap
          >
            <v-tooltip bottom>
              <template #activator="{ on, attrs }">
                <app-btn
                  v-bind="attrs"
                  icon
                  :loading="hasWait(`${$waits.onDatabaseRestore}/${item}`)"
                  @click="handleRestoreBackup(item)"
                  v-on="on"
                >
                  <v-icon dense>
                    $open
                  </v-icon>
                </app-btn>
              </template>
              <span>{{ $t('app.database.tooltip.restore_backup') }}</span>
            </v-tooltip>

            <v-tooltip bottom>
              <template #activator="{ on, attrs }">
                <app-btn
                  v-bind="attrs"
                  icon
                  :loading="hasWait(`${$waits.onDatabaseDeleteBackup}/${item}`)"
                  @click="handleDeleteBackup(item)"
                  v-on="on"
                >
                  <v-icon dense>
                    $delete
                  </v-icon>
                </app-btn>
              </template>
              <span>{{ $t('app.database.tooltip.delete_backup') }}</span>
            </v-tooltip>
          </td>
        </tr>
      </tbody>
    </v-simple-table>

    <v-divider />

    <v-card-text>
      <v-row>
        <v-col cols="6">
          <app-btn
            small
            block
            class="mb-2"
            color="primary"
            :loading="hasWait($waits.onDatabaseCompact)"
            @click="handleCompactDatabase"
          >
            {{ $t('app.database.btn.compact_database') }}
          </app-btn>
        </v-col>
        <v-col cols="6">
          <app-btn
            small
            block
            class="mb-2"
            color="primary"
            :loading="hasWaitsBy(`${$waits.onDatabasePostBackup}/`)"
            @click="handleCreateBackup"
          >
            {{ $t('app.database.btn.create_backup') }}
          </app-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { SocketActions } from '@/api/socketActions'
import StateMixin from '@/mixins/state'

@Component({ })
export default class MoonrakerDatabaseCard extends Mixins(StateMixin) {
  get backups (): string[] {
    return this.$typedGetters['database/getBackups']
  }

  databaseRefresh () {
    SocketActions.serverDatabaseList()
  }

  async handleRestoreBackup (filename: string) {
    const result = await this.$confirm(
      this.$tc('app.general.simple_form.msg.confirm_restore_backup'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (result) {
      SocketActions.serverDatabaseRestore(filename)
    }
  }

  async handleDeleteBackup (filename: string) {
    const result = await this.$confirm(
      this.$tc('app.general.simple_form.msg.confirm_delete', 1),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (result) {
      SocketActions.serverDatabaseDeleteBackup(filename)
    }
  }

  handleCreateBackup () {
    const timestamp = this.$filters.formatTimestamp(Date.now())

    SocketActions.serverDatabasePostBackup(`${timestamp}.db`)
  }

  handleCompactDatabase () {
    SocketActions.serverDatabaseCompact()
  }
}
</script>
