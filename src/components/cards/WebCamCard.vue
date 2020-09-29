<template>
  <v-card>
    <v-card-title >
      <v-icon large left>mdi-camera</v-icon>
      <span class="title font-weight-light text-h5">Camera</span>
    </v-card-title>
    <img src="http://voron2.ismy.io/webcam/?action=stream" class="webcam" />
  </v-card>
</template>

<style type="scss" scoped>
  .webcam {
    width: 100%;
  }
</style>
