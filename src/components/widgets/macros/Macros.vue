<template>
  <div>
    <v-expansion-panels
      v-model="expanded"
      accordion
      multiple
    >
      <v-expansion-panel
        v-for="category in macros"
        :key="`category-${category.id}`"
      >
        <v-expansion-panel-header>
          <template #actions>
            <v-icon
              small
              class="mr-2"
            >
              $expand
            </v-icon>
          </template>
          <div>
            {{ category.name ?? $t('app.general.label.uncategorized') }}
            <v-chip
              small
              class="ml-2"
            >
              {{ category.macros.length }}
            </v-chip>
            <app-btn
              icon
              text
              small
              color=""
              class="ml-2"
              @click.prevent.stop="handleEditCategory"
            >
              <v-icon small>
                $cog
              </v-icon>
            </app-btn>
          </div>
        </v-expansion-panel-header>

        <v-expansion-panel-content>
          <v-tooltip
            v-for="macro in category.macros"
            :key="`category-${macro.name}`"
            top
            :disabled="!macro.config.description || macro.config.description === 'G-Code macro'"
          >
            <template #activator="{ on, attrs }">
              <macro-btn
                v-bind="attrs"
                :macro="macro"
                :loading="hasWait(`${$waits.onMacro}${macro.name}`)"
                class="me-2 mb-2 d-inline-block"
                v-on="on"
                @click="sendGcode($event, `${$waits.onMacro}${macro.name}`)"
              >
                {{ macro.alias || macro.name }}
              </macro-btn>
            </template>
            <span>{{ macro.config.description }}</span>
          </v-tooltip>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import MacroBtn from './MacroBtn.vue'

@Component({
  components: {
    MacroBtn
  }
})
export default class Macros extends Mixins(StateMixin) {
  get macros () {
    return this.$store.getters['macros/getVisibleMacros']
  }

  get expanded () {
    let expanded: number[] = this.$store.state.macros.expanded
    // Remove any indexes that may no longer exist.
    expanded = expanded.filter(i => i <= this.macros.length)
    return expanded
  }

  set expanded (val: number[]) {
    this.$store.dispatch('macros/saveExpanded', val)
  }

  handleEditCategory () {
    this.$router.push('/settings/#macros')
  }
}
</script>

<style lang="scss" scoped>
  :deep(.v-expansion-panel::before) {
    box-shadow: none;
  }
</style>
