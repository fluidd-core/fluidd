export interface ServerState {
  klippy_retries: number;
  info: Moonraker.Server.InfoResponse;
  system_info: SystemInfo | null;
  peripherals: Peripherals;
  can_uuids: Record<string, Moonraker.Peripherals.CanbusUuid[]> | null;
  config: Moonraker.Server.Config;
  moonraker_stats: ServerSystemStat[];
  throttled_state: ServerThrottledState | null;
  cpu_temp: number | null;
  system_cpu_usage?: Record<string, number>;
  system_uptime?: number;
  websocket_connections?: number;
}

export interface ServerSystemStat {
  time: number;
  cpu_usage: number;
  memory: number;
  mem_units: string;
}

export interface ServerThrottledState {
  bits: number;
  flags: ServerFlags[];
}

export type ServerFlags =
  'Under-Voltage Detected' |
  'Frequency Capped' |
  'Currently Throttled' |
  'Temperature Limit Active' |
  'Previously Under-Volted' |
  'Previously Frequency Capped' |
  'Previously Throttled' |
  'Previously Temperature Limited'

export interface SystemInfo {
  available_services?: string[];
  service_state?: ServiceState;
  cpu_info?: CpuInfo;
  sd_info?: SDInfo;
  distribution?: DistroInfo;
  virtualization?: Virtualization;
  network?: NetworkState;
  canbus?: CanBusState;
  instance_ids: InstanceIds;
}

export interface ServiceState {
  [id: string]: ServiceStateDetails;
}

interface ServiceStateDetails {
  active_state?: string;
  sub_state?: string;
}

export interface ServiceInfo {
  name: string;
  active_state?: string;
  sub_state?: string;
}

export interface CpuInfo {
  cpu_count: number;
  bits: string;
  processor: string;
  cpu_desc: string;
  hardware_desc: string;
  model: string;
  total_memory: number;
}

export interface SDInfo {
  manufacturer_id: string;
  manufacturer: string;
  oem_id: string;
  product_name: string;
  product_revision: string;
  serial_number: string;
  manufacturer_date: string;
  capacity: string;
  total_bytes: number;
}

export interface DistroInfo {
  name: string;
  id: string;
  version: string;
  version_parts: DistroVersionParts;
  like: string;
  codename: string;
  release_info?: ReleaseInfo;
}

export interface ReleaseInfo {
  codename?: string;
  id?: string;
  name?: string;
  version_id?: string;
}

export interface DistroVersionParts {
  major: string;
  minor: string;
  build_number: string;
}

export interface Virtualization {
  virt_type: string;
  virt_identifier: string;
}

export interface NetworkState {
  [id: string]: NetworkInterface
}

export interface NetworkInterface {
  mac_address?: string;
  ip_addresses?: NetworkIpAddress[];
}

export interface NetworkIpAddress {
  family?: string;
  address?: string;
  is_link_local?: boolean;
}

export interface CanBusState {
  [id: string]: CanBusInterface;
}

export interface CanBusInterface {
  tx_queue_len?: number;
  bitrate?: number;
  driver?: string;
}

export interface InstanceIds {
  moonraker: string;
  klipper: string;
}

export interface Peripherals {
  usb_devices: Moonraker.Peripherals.UsbDevice[] | null;
  serial_devices: Moonraker.Peripherals.SerialDevice[] | null;
  v4l2_devices: Moonraker.Peripherals.V4l2Device[] | null;
  libcamera_devices: Moonraker.Peripherals.LibcameraDevice[] | null;
}
