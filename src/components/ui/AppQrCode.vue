<template>
  <qrcode-vue
    :value="value"
    :size="size"
    level="H"
  ></qrcode-vue>
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

  @Prop({ type: Number, default: 300 })
  size!: number;
}
</script>
