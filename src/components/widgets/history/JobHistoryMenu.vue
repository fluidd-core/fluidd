<template>
  <v-menu
    bottom
    left
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        fab small text
        v-bind="attrs"
        v-on="on"
      >
        <v-icon>
          $menu
        </v-icon>
      </v-btn>
    </template>

    <v-list
      dense>
      <v-list-item
        v-if="!readonly"
        :disabled="disabled"
        @click="emulateClick(false)">
        <v-list-item-title>
          <v-icon small left>$fileUpload</v-icon>
          Upload
        </v-list-item-title>
      </v-list-item>
    </v-list>

  </v-menu>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({})
export default class JobHistoryMenu extends Vue {
}
</script>
