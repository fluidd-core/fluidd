export interface ServerState {
  klippy_retries: number;
  info: Moonraker.Server.InfoResponse;
  system_info: Moonraker.Machine.SystemInfo | null;
  peripherals: Peripherals;
  can_uuids: Record<string, Moonraker.Peripherals.CanbusUuid[]> | null;
  config: Moonraker.Server.Config;
  moonraker_stats: Readonly<Moonraker.ProcStats.MoonrakerStats>[];
  throttled_state: Moonraker.ProcStats.ThrottledState | null;
  cpu_temp: number | null;
  system_cpu_usage: Record<string, number> | null;
  system_uptime: number | null;
  websocket_connections: number | null;
}

export interface ServiceInfo {
  name: string;
  active_state?: string;
  sub_state?: string;
}

export interface Peripherals {
  usb_devices: Moonraker.Peripherals.UsbDevice[] | null;
  serial_devices: Moonraker.Peripherals.SerialDevice[] | null;
  v4l2_devices: Moonraker.Peripherals.V4l2Device[] | null;
  libcamera_devices: Moonraker.Peripherals.LibcameraDevice[] | null;
}
