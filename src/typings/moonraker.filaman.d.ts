declare namespace Moonraker.Spoolman {
  export interface FilamanPaginatedResponse {
    items?: FilamanSpool[];
  }

  export interface FilamanSpool {
    id: number;
    created_at?: string | null;
    last_used_at?: string | null;
    purchase_price?: number | null;
    remaining_weight_g?: number | null;
    initial_total_weight_g?: number | null;
    empty_spool_weight_g?: number | null;
    lot_number?: string | null;
    location_id?: number | null;
    custom_fields?: Record<string, unknown> | null;
    filament?: FilamanFilament | null;
  }

  export interface FilamanFilament {
    id: number;
    designation?: string | null;
    material_type?: string | null;
    price?: number | null;
    raw_material_weight_g?: number | null;
    default_spool_weight_g?: number | null;
    diameter_mm?: number | null;
    density_g_cm3?: number | null;
    manufacturer?: FilamanManufacturer | null;
    colors?: FilamanFilamentColor[] | null;
  }

  export interface FilamanFilamentColor {
    color?: {
      hex_code?: string | null;
    } | null;
  }

  export interface FilamanManufacturer {
    id?: number | null;
    name?: string | null;
    empty_spool_weight_g?: number | null;
  }

  export interface FilamanExtruderSpoolsResponse {
    extruder_spools?: Partial<Record<string, number | null>>;
  }

  export interface FilamanActiveSpoolPayload {
    spool_id?: number | string | null;
  }
}
