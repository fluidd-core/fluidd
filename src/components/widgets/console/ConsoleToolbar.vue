<template>
  <v-toolbar dense>
    <v-spacer />

    <v-tooltip
      v-if="autoScrollPaused"
      bottom
    >
      <template #activator="{ on, attrs }">
        <app-btn
          v-bind="attrs"
          icon
          text
          v-on="on"
          @click="$emit('scrollToLatest')"
        >
          <v-icon>
            {{ flipLayoutModel ? '$up' : '$down' }}
          </v-icon>
        </app-btn>
      </template>
      <span>{{ $t('app.general.btn.scroll_to_latest') }}</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <app-btn
          v-bind="attrs"
          icon
          text
          v-on="on"
          @click="flipLayoutModel = !flipLayoutModel"
        >
          <v-icon>
            {{ flipLayoutModel ? '$dockBottom' : '$dockTop' }}
          </v-icon>
        </app-btn>
      </template>
      <span>{{ $t('app.general.btn.flip_layout') }}</span>
    </v-tooltip>

    <console-filter-menu :disabled="disabled" />

    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <app-btn
          v-bind="attrs"
          icon
          text
          v-on="on"
          @click="$emit('clear')"
        >
          <v-icon>
            $delete
          </v-icon>
        </app-btn>
      </template>
      <span>{{ $t('app.general.btn.clear') }}</span>
    </v-tooltip>

    <div
      style="max-width: 160px;"
      class="ml-1"
    >
      <v-text-field
        v-model="searchModel"
        :disabled="disabled"
        outlined
        dense
        single-line
        hide-details
        clearable
        spellcheck="false"
        :append-icon="searchModel ? undefined : '$magnify'"
        @focus="$event.target.select()"
      />
    </div>
  </v-toolbar>
</template>

<script lang="ts">
import { Component, Vue, Prop, PropSync } from 'vue-property-decorator'
import ConsoleFilterMenu from './ConsoleFilterMenu.vue'

@Component({
  components: {
    ConsoleFilterMenu
  }
})
export default class ConsoleToolbar extends Vue {
  @Prop({ type: Boolean })
  readonly disabled?: boolean

  @Prop({ type: Boolean })
  readonly autoScrollPaused?: boolean

  @PropSync('search', { type: String, default: '' })
  searchModel!: string

  @PropSync('flipLayout', { type: Boolean, default: false })
  flipLayoutModel!: boolean
}
</script>
