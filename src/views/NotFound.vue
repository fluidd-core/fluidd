<template>
  <v-row
    :dense="$vuetify.breakpoint.smAndDown"
    justify="center"
    align="center"
  >
    <v-col>
      <center>
        <div class="text-h5">
          404 Not Found
        </div>
        <app-btn
          to="/"
          class="mt-5"
        >
          Return to the dashboard
        </app-btn>
      </center>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({})
export default class NotFound extends Vue {}
</script>
