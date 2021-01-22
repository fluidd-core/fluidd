export interface DevicePowerState {
  [key: string]: Device[];
  devices: Device[];
}

export interface Device {
  device: string;
  status: 'init' | 'on' | 'off' | 'error';
  type: 'gpio' | 'tplink_smartplug';
  locked_while_printing: boolean;
}
