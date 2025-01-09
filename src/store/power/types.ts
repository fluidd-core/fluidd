export interface DevicePowerState {
  devices: Device[];
}

export type DeviceStatus = 'init' | 'on' | 'off' | 'error'

export type DeviceType = 'gpio' | 'klipper_device' | 'rf' | 'tplink_smartplug' | 'tasmota' | 'shelly' | 'homeseer' | 'homeassistant' | 'loxonev1' | 'smartthings' | 'mqtt' | 'hue' | 'http' | 'uhubctl'

export interface Device {
  device: string;
  status: DeviceStatus;
  type: DeviceType;
  locked_while_printing: boolean;
}
