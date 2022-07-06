<template>
  <qrcode-vue
    :value="value"
    :size="size"
    level="L"
  />
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import QrcodeVue from 'qrcode.vue'

@Component({
  components: {
    QrcodeVue
  }
})
export default class AppQrCode extends Vue {
  @Prop({ type: String, default: '' })
  value!: string;

  @Prop({ type: Number, default: 260 })
  size!: number;
}
</script>

<style lang="scss" scoped>
  :deep(canvas, svg) {
    display: block;
    padding: 10px;
    background: #fff;
  }
</style>
