declare namespace Moonraker.Power {
  export interface DevicesResponse {
    devices: Device[];
  }

  export interface StatusResponse {
    [device: string]: DeviceState;
  }

  export interface Device {
    device: string;
    status: DeviceState;
    locked_while_printing: boolean;
    type: DeviceType;
  }

  export type DeviceState = 'on' | 'off' | 'init' | 'error'

  export type DeviceType = 'gpio' | 'klipper_device' | 'tplink_smartplug' | 'tasmota' | 'shelly' | 'homeseer' | 'homeassistant' | 'loxonev1' | 'rf' | 'mqtt' | 'smartthings' | 'hue' | 'http' | 'uhubctl'
}
