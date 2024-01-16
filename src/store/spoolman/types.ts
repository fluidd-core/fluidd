export interface Vendor {
  id: number;
  registered: Date;
  name: string;
  comment?: string;
}

export interface Filament {
  id: number;
  registered: Date;
  density: number;
  diameter: number;

  name?: string;
  vendor?: Vendor;
  material?: string;
  price?: number;
  weight?: number;
  spool_weight?: number;
  article_number?: string;
  comment?: string;
  settings_extruder_temp?: number;
  settings_bed_temp?: number;
  color_hex?: string;
}

export interface Spool {
  id: number;
  registered: Date;
  filament: Filament;
  used_weight: number;
  used_length: number;
  archived: boolean;

  remaining_weight?: number;
  remaining_length?: number;
  location?: string;
  lot_nr?: string;
  comment?: string;
  first_used?: Date;
  last_used?: Date;
}

export interface SpoolmanState {
  availableSpools: Spool[];
  activeSpool?: number;
  supported: boolean;
  dialog: SpoolSelectionDialogState;
  socket?: WebSocket;
}

export interface SpoolSelectionDialogState {
  show: boolean;
  filename?: string;
}

export interface WebsocketBasePayload {
  type: 'added' | 'updated' | 'deleted';
  resource: string;
  date: string;
  payload: Record<string, any>;
}

export interface WebsocketSpoolPayload extends WebsocketBasePayload {
  resource: 'spool';
  payload: Spool;
}

export interface WebsocketFilamentPayload extends WebsocketBasePayload {
  resource: 'filament';
  payload: Filament;
}

export interface WebsocketVendorPayload extends WebsocketBasePayload {
  resource: 'vendor';
  payload: Vendor;
}
