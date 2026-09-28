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

  export type DeviceAction = 'on' | 'off' | 'toggle'

  export type DeviceType = 'gpio' | 'klipper_device' | 'tplink_smartplug' | 'tasmota' | 'shelly' | 'homeseer' | 'homeassistant' | 'loxonev1' | 'rf' | 'mqtt' | 'smartthings' | 'hue' | 'http' | 'uhubctl'
}

declare namespace Moonraker {
  export interface Methods {
    'machine.device_power.devices': {
      params: undefined,
      result: Power.DevicesResponse
    },
    'machine.device_power.status': {
      params: Record<string, null>,
      result: Power.StatusResponse
    },
    'machine.device_power.post_device': {
      params: {
        device: string,
        action: Power.DeviceAction
      },
      result: Power.StatusResponse
    }
  }
}
