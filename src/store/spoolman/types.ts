export interface SpoolmanState {
  info: SpoolmanInfo | null;
  spools: SpoolmanSpool[];
  activeSpool: number | null;
  currency: string | null;
  connected: boolean;
  dialog: SpoolSelectionDialogState;
  socket?: WebSocket;
}

export interface SpoolmanInfo {
  version: string;
  debug_mode: boolean;
  automatic_backups: boolean;
  data_dir: string;
  logs_dir: string;
  backups_dir: string;
  db_type: string;
  git_commit: string;
  build_date: Date;
}

export interface SpoolmanSpool {
  id: number;
  registered: string;
  filament: SpoolmanFilament;

  first_used?: string;
  last_used?: string;
  price?: number;
  remaining_weight?: number;
  initial_weight?: number;
  spool_weight?: number;
  used_weight?: number;
  remaining_length?: number;
  used_length?: number;
  location?: string;
  lot_nr?: string;
  comment?: string;
  archived: boolean;
  extra?: Record<string, unknown>;
}

export interface SpoolmanFilament {
  id: number;
  registered: string;
  density: number;
  diameter: number;

  name?: string;
  vendor?: SpoolmanVendor;
  material?: string;
  price?: number;
  weight?: number;
  spool_weight?: number;
  article_number?: string;
  comment?: string;
  settings_extruder_temp?: number;
  settings_bed_temp?: number;
  color_hex?: string;
  multi_color_hexes?: string;
  multi_color_direction?: string;
  external_id?: string;
  extra?: Record<string, unknown>;
}

export interface SpoolmanVendor {
  id: number;
  registered: string;
  name: string;

  comment?: string;
  empty_spool_weight?: number;
  external_id?: string;
  extra?: Record<string, unknown>;
}

export interface Spool extends Omit<SpoolmanSpool, 'registered' | 'filament' | 'first_used' | 'last_used'> {
  registered: Date;
  filament: Filament;
  filament_name: string;

  first_used?: Date;
  last_used?: Date;
  initial_length?: number;
}

export interface Filament extends Omit<SpoolmanFilament, 'registered' | 'vendor' | 'multi_color_hexes'> {
  registered: Date;

  vendor?: Vendor;
  multi_color_hexes?: string[];
  colors?: string[];
}

export interface Vendor extends Omit<SpoolmanVendor, 'registered'> {
  registered: Date;
}

export interface SpoolSelectionDialogState {
  show: boolean;
  filename?: string;
  targetMacro?: string;
}

export interface WebsocketBasePayload {
  type: 'added' | 'updated' | 'deleted';
  resource: string;
  date: string;
  payload: Record<string, any>;
}

export interface WebsocketSpoolPayload extends WebsocketBasePayload {
  resource: 'spool';
  payload: SpoolmanSpool;
}

export interface WebsocketFilamentPayload extends WebsocketBasePayload {
  resource: 'filament';
  payload: SpoolmanFilament;
}

export interface WebsocketVendorPayload extends WebsocketBasePayload {
  resource: 'vendor';
  payload: SpoolmanVendor;
}

export interface SpoolmanProxyResponseV2Success<T> {
  response: T;
  response_headers?: Record<string, string>;
  error: null;
}

export interface SpoolmanProxyResponseV2Error {
  response: null;
  error: string | {
    message: string;
  };
}

export type SpoolmanProxyResponseV2<T> = SpoolmanProxyResponseV2Success<T> | SpoolmanProxyResponseV2Error

export type SpoolmanProxyResponse<T> = T | SpoolmanProxyResponseV2<T>
