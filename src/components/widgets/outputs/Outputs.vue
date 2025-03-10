<template>
  <div>
    <v-expansion-panels
      accordion
      multiple
    >
      <v-expansion-panel>
        <v-expansion-panel-header
          v-if="all.controllableFans.length > 0"
        >
          <template #actions>
            <v-icon
              small
              class="mr-2"
            >
              $expand
            </v-icon>
          </template>
          <div>
            {{ $t('app.general.title.controllable_fans') }}
            <v-chip
              small
              class="ml-2"
            >
              {{ all.controllableFans.length }}
            </v-chip>
          </div>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <template v-for="(item, i) in all.controllableFans">
            <OutputItem
              :key="item.key"
              :item="item"
            />
            <v-divider
              v-if="i < all.controllableFans.length - 1"
              :key="`divider-controllableFans${i}`"
              class="my-2"
            />
          </template>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header
          v-if="all.unControllableFans.length > 0"
        >
          <template #actions>
            <v-icon
              small
              class="mr-2"
            >
              $expand
            </v-icon>
          </template>
          <div>
            {{ $t('app.general.title.other_fans') }}
            <v-chip
              small
              class="ml-2"
            >
              {{ all.unControllableFans.length }}
            </v-chip>
          </div>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <template v-for="(item, i) in all.unControllableFans">
            <OutputItem
              :key="item.key"
              :item="item"
            />
            <v-divider
              v-if="i < all.unControllableFans.length - 1"
              :key="`divider-unControllableFans${i}`"
              class="my-2"
            />
          </template>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header
          v-if="all.pins.length > 0"
        >
          <template #actions>
            <v-icon
              small
              class="mr-2"
            >
              $expand
            </v-icon>
          </template>
          <div>
            {{ $t('app.general.title.output_pins') }}
            <v-chip
              small
              class="ml-2"
            >
              {{ all.pins.length }}
            </v-chip>
          </div>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <template v-for="(item, i) in all.pins">
            <OutputItem
              :key="item.key"
              :item="item"
            />
            <v-divider
              v-if="i < all.pins.length - 1"
              :key="`divider-pins${i}`"
              class="my-2"
            />
          </template>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header
          v-if="all.leds.length > 0"
        >
          <template #actions>
            <v-icon
              small
              class="mr-2"
            >
              $expand
            </v-icon>
          </template>
          <div>
            {{ $t('app.general.title.leds') }}
            <v-chip
              small
              class="ml-2"
            >
              {{ all.leds.length }}
            </v-chip>
          </div>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <template v-for="(item, i) in all.leds">
            <OutputItem
              :key="item.key"
              :item="item"
            />
            <v-divider
              v-if="i < all.leds.length - 1"
              :key="`divider-leds${i}`"
              class="my-2"
            />
          </template>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import OutputItem from '@/components/widgets/outputs/OutputItem.vue'
import StateMixin from '@/mixins/state'
import type { Fan, Led, OutputPin } from '@/store/printer/types'

@Component({
  components: {
    OutputItem
  }
})
export default class Outputs extends Mixins(StateMixin) {
  get all () {
    const controllableFans: Array<Fan> = [
      ...this.$store.getters['printer/getControllableFans']
    ]
    const unControllableFans: Array<Fan> = [
      ...this.$store.getters['printer/getUnctrollableFans']
    ]
    const pins: Array<OutputPin> = [
      ...this.$store.getters['printer/getPins']
    ]
    const leds: Array<Led> = [
      ...this.$store.getters['printer/getAllLeds']
    ]
    return {
      controllableFans,
      unControllableFans,
      pins,
      leds
    }
  }
}
</script>
