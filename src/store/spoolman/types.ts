export interface SpoolmanState {
  info: Moonraker.Spoolman.Info | null;
  spools: Moonraker.Spoolman.Spool[];
  activeSpool: number | null;
  currency: string | null;
  connected: boolean;
  dialog: SpoolSelectionDialogState;
  socket?: WebSocket;
}

export interface Spool extends Omit<Moonraker.Spoolman.Spool, 'registered' | 'filament' | 'first_used' | 'last_used'> {
  registered: Date;
  filament: Filament;
  filament_name: string;

  first_used?: Date;
  last_used?: Date;
  initial_length?: number;
  progress?: number;
}

export interface Filament extends Omit<Moonraker.Spoolman.Filament, 'registered' | 'vendor' | 'multi_color_hexes'> {
  registered: Date;

  vendor?: Vendor;
  multi_color_hexes?: string[];
  colors?: string[];
}

export interface Vendor extends Omit<Moonraker.Spoolman.Vendor, 'registered'> {
  registered: Date;
}

export interface SpoolSelectionDialogState {
  show: boolean;
  filename?: string;
  targetMacro?: string;
  spoolSelectionOnly?: boolean;
  selectedSpoolId?: number;
}

export interface WebsocketBasePayload {
  type: 'added' | 'updated' | 'deleted';
  resource: string;
  date: string;
  payload: Record<string, any>;
}

export interface WebsocketSpoolPayload extends WebsocketBasePayload {
  resource: 'spool';
  payload: Moonraker.Spoolman.Spool;
}

export interface WebsocketFilamentPayload extends WebsocketBasePayload {
  resource: 'filament';
  payload: Moonraker.Spoolman.Filament;
}

export interface WebsocketVendorPayload extends WebsocketBasePayload {
  resource: 'vendor';
  payload: Moonraker.Spoolman.Vendor;
}
