<template>
  <v-menu
    bottom
    left
    offset-y
    transition="slide-y-transition"
    :close-on-content-click="false"
  >
    <template #activator="{ on, attrs }">
      <v-badge
        bordered
        color="warning"
        dot
        overlap
        :value="model.length > 0"
        :offset-y="15"
        :offset-x="15"
      >
        <v-btn
          :disabled="disabled"
          fab
          small
          text
          v-bind="attrs"
          v-on="on"
        >
          <v-icon>
            $filter
          </v-icon>
        </v-btn>
      </v-badge>
    </template>

    <v-list
      flat
      two-line
    >
      <v-list-item-group
        v-model="model"
        multiple
        active-class=""
      >
        <template v-for="(filter, i) in filters">
          <v-list-item
            :key="`filter-${i}`"
            :disabled="disabled"
            :value="filter"
          >
            <template #default="{ active }">
              <v-list-item-action>
                <v-checkbox :input-value="active" />
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>
                  {{ filter.text }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ filter.desc }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </template>
          </v-list-item>
        </template>
      </v-list-item-group>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { FileFilter } from '@/store/files/types'
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'

@Component({})
export default class FileSystemFilterMenu extends Vue {
  @Prop({ type: String, required: true })
  public root!: string

  // If the controls are disabled or not.
  @Prop({ type: Boolean, default: false })
  public disabled!: boolean

  model = []
  filters: FileFilter[] = [
    {
      value: 'print_start_time',
      text: this.$tc('app.file_system.filters.label.print_start_time'),
      desc: this.$tc('app.file_system.filters.label.print_start_time_desc')
    }
  ]

  get readonly () {
    return this.$store.getters['files/getRootProperties'](this.root).readonly
  }

  @Watch('model')
  onFiltersChange (model: any) {
    this.$emit('change', model)
  }
}
</script>
