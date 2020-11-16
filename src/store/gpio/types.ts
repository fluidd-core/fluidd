export interface GpioState {
  [key: string]: Device[];
  devices: Device[];
}

export interface Device {
  id: string;
  name: string;
  state?: 1 | 0;
}
