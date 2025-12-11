export interface MacrosState {
  stored: Macro[];
  categories: MacroCategory[];
  expanded: number[];
}

export interface Macro {
  name: string;
  description?: string;
  alias?: string;
  visible: boolean;
  categoryId?: string;
  category?: MacroCategory;
  assignTo?: string;
  disabledWhilePrinting?: boolean;
  color?: string;
  config?: Klipper.GcodeMacroSettings;
  order?: number;
  variables?: Record<string, unknown>
}

export interface MacroCategory {
  id: string;
  name: string;
  count?: number;
  visible?: number;
}
