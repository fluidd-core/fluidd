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
          <draggable
            v-model="containers[containerIndex]"
            class="list-group"
            v-bind="dragOptions"
            @start.stop="drag = true"
            @end.stop="updateLayout"
          >
            <transition-group
              type="transition"
              :name="!drag ? 'flip-list' : null"
            >
              <template v-for="c in container">
                <diagnostics-card
                  v-if="c.enabled || inLayout"
                  :key="c.id"
                  :config="c"
                  class="mb-2 mb-sm-4"
                  @edit="handleEditCard"
                />
              </template>
            </transition-group>
          </draggable>
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
import draggable from 'vuedraggable'
import { v4 as uuidv4 } from 'uuid'
import StateMixin from '@/mixins/state'
import { DiagnosticsCardConfig, DiagnosticsCardContainer } from '@/store/diagnostics/types'
import DiagnosticsCard from '@/components/widgets/diagnostics/DiagnosticsCard.vue'
import CollapsableCard from '@/components/common/CollapsableCard.vue'
import DiagnosticsCardConfigDialog from '@/components/widgets/diagnostics/DiagnosticsCardConfigDialog.vue'
import { LayoutConfig } from '@/store/layout/types'
import { defaultState } from '@/store/layout'

@Component({
  components: { draggable, CollapsableCard, DiagnosticsCard, DiagnosticsCardConfigDialog }
})
export default class Diagnostics extends Mixins(StateMixin) {
  dialogState: { active: boolean, card: DiagnosticsCardConfig | null } = {
    active: false,
    card: null
  }

  drag = false
  containers: Array<DiagnosticsCardConfig[]> = []

  mounted () {
    this.onLayoutChange()
  }

  handleAddCard () {
    const clonedDefaultCard = JSON.parse(JSON.stringify(defaultState().layouts.diagnostics.container1[0]))
    clonedDefaultCard.id = ''
    this.dialogState.card = clonedDefaultCard
    this.dialogState.active = true
  }

  handleEditCard (card: DiagnosticsCardConfig) {
    this.dialogState.card = JSON.parse(JSON.stringify(card))
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
    return (this.$store.state.config.layoutMode)
  }

  get layout (): DiagnosticsCardContainer {
    return this.$store.getters['layout/getLayout']('diagnostics')
  }

  @Watch('layout', { deep: true })
  onLayoutChange () {
    const containers = Object.values(this.layout)

    while (containers.length < 4) {
      containers.push([])
    }

    this.containers = containers.slice(0, 4)
  }

  get dragOptions () {
    return {
      animation: 200,
      handle: '.handle',
      group: 'diagnostics',
      disabled: !this.inLayout,
      ghostClass: 'ghost'
    }
  }

  updateLayout () {
    this.drag = false
    this.$store.dispatch('layout/onLayoutChange', {
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
