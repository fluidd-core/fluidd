export interface ServerState {
  klippy_retries: number;
  info: ServerInfo;
  system_info: SystemInfo | null;
  peripherals: Peripherals;
  can_uuids: Record<string, CanbusUuid[]> | null;
  config: ServerConfig;
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

export interface ServerInfo {
  failed_components: string[];
  klippy_connected: boolean;
  klippy_state: KlippyState;
  components: string[];
  registered_directories: string[];
  warnings: string[];
  moonraker_version?: string;
  api_version?: number[];
  api_version_string?: string;
  websocket_count?: number;
}

export type KlippyState = 'disconnected' | 'startup' | 'ready' | 'error' | 'shutdown'

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
  usb_devices: UsbDevice[] | null;
  serial_devices: SerialDevice[] | null;
  v4l2_devices: V4l2Device[] | null;
  libcamera_devices: LibcameraDevice[] | null;
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

export interface ServerConfig {
  authorization: ServerAuthorization;
  server: ServerConfiguration;
  data_store?: DataStoreConfiguration;
  spoolman?: SpoolmanConfiguration;
}

export interface ServerAuthorization {
  enabled: boolean;
}

export interface ServerConfiguration {
  gcode_store_size?: number;
  temperature_store_size?: number;
}

export interface DataStoreConfiguration {
  gcode_store_size?: number;
  temperature_store_size?: number;
}

export interface SpoolmanConfiguration {
  server?: string;
}
