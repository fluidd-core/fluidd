declare namespace Moonraker.Peripherals {
  export interface UsbResponse {
    usb_devices: UsbDevice[];
  }

  export interface SerialResponse {
    serial_devices: SerialDevice[];
  }

  export interface VideoResponse {
    v4l2_devices: V4l2Device[];
    libcamera_devices: LibcameraDevice[];
  }

  export interface CanbusResponse {
    can_uuids: CanbusUuid[];
  }

  export interface UsbDevice {
    bus_num: number;
    device_num: number;
    usb_location: string;
    vendor_id: string;
    product_id: string;
    manufacturer?: string | null;
    product?: string | null;
    class?: string | null;
    subclass?: string | null;
    protocol?: string | null;
    description?: string | null;
    serial?: string | null;
  }

  export interface SerialDevice {
    device_type: string;
    device_path: string;
    device_name: string;
    driver_name: string;
    path_by_hardware?: string | null;
    path_by_id?: string | null;
    usb_location?: string | null;
  }

  export interface V4l2Device {
    device_name: string;
    device_path: string;
    camera_name: string;
    driver_name: string;
    alt_name?: string | null;
    hardware_bus: string;
    capabilities: string[];
    version: string;
    path_by_hardware?: string | null;
    path_by_id?: string | null;
    usb_location?: string | null;
    modes: V4l2DeviceMode[];
  }

  export interface V4l2DeviceMode {
    format: string;
    description?: string | null;
    flags: string[];
    resolutions: string[];
  }

  export interface LibcameraDevice {
    libcamera_id: string;
    model: string;
    modes: LibcameraDeviceMode[];
  }

  export interface LibcameraDeviceMode {
    format: string;
    resolutions: string[];
  }

  export interface CanbusUuid {
    uuid: string;
    application: string;
  }
}
