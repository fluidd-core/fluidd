import { Thumbnail } from '@/store/files/types'
import Vue from 'vue'
import { Component } from 'vue-property-decorator'
import { getThumb } from '@/store/helpers'

@Component
export default class FilesMixin extends Vue {
  getThumb (thumbnails: Thumbnail[], goLarge: boolean) {
    if (thumbnails.length) {
      return getThumb(thumbnails, goLarge)
    }
    return null
  }
}
