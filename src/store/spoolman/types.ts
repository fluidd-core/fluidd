export interface Vendor {
  id: number;
  registered: Date;
  name: string;
}

export interface Filament {
  id: number;
  registered: Date;
  name: string;
  vendor: Vendor;
  material: string;
  price: number;
  density: number;
  diameter: number;
  weight: number;
  color: string;
}

export interface Spool {
  id: number;
  registered: Date;
  filament: Filament;
  remaining_weight: number;
  used_weight: number;
  location?: string;
  lot_nr?: string;
  comment?: string;
}

export interface SpoolmanState {
  availableSpools: Spool[];
  activeSpool?: number;
  supported: boolean;
}
