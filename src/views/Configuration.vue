<template>
  <v-container fluid class="dashboard">
    <v-row>
      <v-col cols="4" class="pt-0">
        <p>Printer configuration coming soon..</p>
      </v-col>
      <v-col>

      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {
  }
})
export default class Configuration extends Mixins(UtilsMixin) {

}
</script>
