export interface GpioState {
  devices: Device[];
}

export interface Device {
  id: string;
  name: string;
  state?: 1 | 0;
}
