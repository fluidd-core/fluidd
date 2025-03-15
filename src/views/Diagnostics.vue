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
            target=":first-child"
            @end.stop="updateLayout"
          >
            <transition-group
              type="transition"
              :name="!inLayout ? 'flip-list' : undefined"
            >
              <template v-for="c in container">
                <diagnostics-card
                  v-if="c.enabled || inLayout"
                  :key="c.id"
                  :config="c"
                  class="mb-2 mb-md-4"
                  @edit="handleEditCard"
                />
              </template>
            </transition-group>
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
import type { DiagnosticsCardConfig, DiagnosticsCardContainer } from '@/store/diagnostics/types'
import DiagnosticsCard from '@/components/widgets/diagnostics/DiagnosticsCard.vue'
import DiagnosticsCardConfigDialog from '@/components/widgets/diagnostics/DiagnosticsCardConfigDialog.vue'
import type { LayoutConfig } from '@/store/layout/types'
import { defaultState } from '@/store/layout/state'

@Component({
  components: {
    DiagnosticsCard,
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
    const clonedDefaultCard = JSON.parse(JSON.stringify(defaultState().layouts.diagnostics.container1[0])) as DiagnosticsCardConfig
    clonedDefaultCard.id = ''
    this.dialogState.card = clonedDefaultCard
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
