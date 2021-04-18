<template>
  <div>
    <v-expansion-panels
      accordion
      multiple
      v-model="expanded"
    >
      <template v-for="category in macros">
        <v-expansion-panel
          v-if="category.macros.length > 0"
          :key="`category-${category.name}`"
        >
          <v-expansion-panel-header>
            <template v-slot:actions>
              <v-icon small class="mr-2">
                $expand
              </v-icon>
            </template>
            {{ $filters.capitalize(category.name) }}
          </v-expansion-panel-header>

          <v-expansion-panel-content>
            <template v-for="macro in category.macros">
              <app-macro-btn
                v-if="macro.visible"
                :macro="macro"
                :key="`category-${macro.name}`"
                @click="sendGcode($event, `${waits.onMacro}${macro.name}`)"
                :loading="hasWait(`${waits.onMacro}${macro.name}`)"
                :elevation="2"
                class="me-2 mb-2 float-left">
                {{ macro.name }}
              </app-macro-btn>
            </template>
          </v-expansion-panel-content>

        </v-expansion-panel>
      </template>
    </v-expansion-panels>
    <!-- <pre>{{ macros }}</pre> -->
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Waits } from '@/globals'

@Component({})
export default class Macros extends Mixins(StateMixin) {
  waits = Waits

  get macros () {
    return this.$store.getters['macros/getVisibleMacros']
  }

  get expanded () {
    return this.$store.state.macros.expanded
  }

  set expanded (val: number[]) {
    this.$store.dispatch('macros/saveExpanded', val)
  }
}
</script>
