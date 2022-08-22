import { CameraService, LegacyCameraType } from '@/store/cameras/types'

const getCameraServiceForLegacyCameraType = (type: LegacyCameraType): CameraService => {
  switch (type) {
    case 'mjpgstream':
      return 'mjpegstreamer'
    case 'mjpgadaptive':
      return 'mjpegstreamer-adaptive'
    default:
      return type
  }
}

export default getCameraServiceForLegacyCameraType
