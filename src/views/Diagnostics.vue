<template>
  <div>
    <v-row>
      <v-col cols="12">
        <collapsable-card
          :title="$t('app.general.title.diagnostics')"
          icon="$chart"
        >
          <template #menu>
            <app-btn-collapse-group>
              <app-btn
                small
                class="me-1 my-1"
                @click="handleAddCard"
              >
                <v-icon
                  small
                  left
                >
                  $plus
                </v-icon>
                {{ $t('app.general.title.add_chart') }}
              </app-btn>
              <app-btn
                small
                class="my-1"
                @click="handleAddWatchCard"
              >
                <v-icon
                  small
                  left
                >
                  $plus
                </v-icon>
                {{ $t('app.general.title.add_watches') }}
              </app-btn>
            </app-btn-collapse-group>
          </template>
        </collapsable-card>
      </v-col>
    </v-row>

    <v-row :dense="$vuetify.breakpoint.smAndDown">
      <template v-for="(container, containerIndex) in containers">
        <v-col
          v-if="inLayout || hasCards(container)"
          :key="`container${containerIndex}`"
          cols="12"
          md="6"
          :lg="columnSpan"
          :class="{ 'drag': inLayout }"
        >
          <app-draggable
            v-model="containers[containerIndex]"
            class="list-group"
            :options="{
              group: 'diagnostics',
              disabled: !inLayout,
            }"
            @end.stop="updateLayout"
          >
            <template v-for="c in container">
              <diagnostics-watch-card
                v-if="(c.enabled || inLayout) && c.type === 'watches'"
                :key="c.id"
                :config="c"
                class="mb-2 mb-md-4"
                @edit="handleEditCard"
              />
              <diagnostics-chart-card
                v-else-if="c.enabled || inLayout"
                :key="c.id"
                :config="c"
                class="mb-2 mb-md-4"
                @edit="handleEditCard"
              />
            </template>
          </app-draggable>
        </v-col>
      </template>
    </v-row>

    <diagnostics-card-config-dialog
      v-if="dialogState.active"
      v-model="dialogState.active"
      :config="dialogState.card"
      @save="handleSaveCard"
      @delete="handleDeleteCard"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { v4 as uuidv4 } from 'uuid'
import StateMixin from '@/mixins/state'
import type { DiagnosticsCardConfig, DiagnosticsCardContainer, DiagnosticsChartConfig, DiagnosticsWatchesConfig } from '@/store/diagnostics/types'
import DiagnosticsChartCard from '@/components/widgets/diagnostics/DiagnosticsChartCard.vue'
import DiagnosticsWatchCard from '@/components/widgets/diagnostics/DiagnosticsWatchCard.vue'
import DiagnosticsCardConfigDialog from '@/components/widgets/diagnostics/DiagnosticsCardConfigDialog.vue'
import type { LayoutConfig } from '@/store/layout/types'

@Component({
  components: {
    DiagnosticsChartCard,
    DiagnosticsWatchCard,
    DiagnosticsCardConfigDialog
  }
})
export default class Diagnostics extends Mixins(StateMixin) {
  dialogState: { active: boolean, card: DiagnosticsCardConfig | null } = {
    active: false,
    card: null
  }

  containers: Array<DiagnosticsCardConfig[]> = []

  mounted () {
    this.onLayoutChange()
  }

  handleAddCard () {
    const newCard: DiagnosticsChartConfig = {
      id: '',
      enabled: true,
      collapsed: false,
      type: 'chart',
      title: '',
      icon: 'chart',
      height: 300,
      axes: [
        { enabled: true, unit: '', showLegend: true, metrics: [] },
        { enabled: false, unit: '', showLegend: false, metrics: [] }
      ]
    }
    this.dialogState.card = newCard
    this.dialogState.active = true
  }

  handleAddWatchCard () {
    const newCard: DiagnosticsWatchesConfig = {
      id: '',
      enabled: true,
      collapsed: false,
      type: 'watches',
      title: '',
      icon: 'chart',
      metrics: []
    }
    this.dialogState.card = newCard
    this.dialogState.active = true
  }

  handleEditCard (card: DiagnosticsCardConfig) {
    this.dialogState.card = JSON.parse(JSON.stringify(card)) as DiagnosticsCardConfig
    this.dialogState.active = true
  }

  handleDeleteCard (id: string) {
    for (const container of Object.values(this.layout)) {
      const index = container.findIndex(card => card.id === id)
      if (index > -1) {
        container.splice(index, 1)
        break
      }
    }

    this.updateLayout()
  }

  handleSaveCard (card: DiagnosticsCardConfig) {
    if (card.id === '') {
      card.id = uuidv4()
      this.layout.container1.push(card)
    } else {
      for (const container of Object.values(this.layout)) {
        const index = container.findIndex(existingCard => existingCard.id === card.id)
        if (index > -1) {
          container[index] = card
          break
        }
      }
    }

    this.updateLayout()
  }

  get columnCount () {
    if (this.inLayout) return 4

    return this.containers.reduce((count, container) => +this.hasCards(container) + count, 0)
  }

  get columnSpan () {
    return 12 / this.columnCount
  }

  get inLayout (): boolean {
    return this.$typedState.config.layoutMode
  }

  get layout (): DiagnosticsCardContainer {
    return this.$typedGetters['layout/getLayout']('diagnostics') as DiagnosticsCardContainer
  }

  @Watch('layout', { deep: true })
  onLayoutChange () {
    const containers = Object.values(this.layout)

    while (containers.length < 4) {
      containers.push([])
    }

    this.containers = containers.slice(0, 4)
  }

  updateLayout () {
    this.$typedDispatch('layout/onLayoutChange', {
      name: 'diagnostics',
      value: {
        container1: this.containers[0],
        container2: this.containers[1],
        container3: this.containers[2],
        container4: this.containers[3]
      }
    })
  }

  hasCards (container: LayoutConfig[]) {
    return container.some(card => card.enabled)
  }
}
</script>

<style lang="scss" scoped>
@import '@/scss/draggable.scss';
</style>
