export interface MacrosState {
  stored: Macro[];
  categories: MacroCategory[];
  expanded: number[];
}

export interface Macro {
  name: string;
  visible: boolean;
  categoryId?: string;
  category?: MacroCategory;
  assignTo?: string;
  disabledWhilePrinting?: boolean;
  color?: string;
  config?: any;
}

export interface MacroCategory {
  id: string;
  name: string;
  count?: number;
  visible?: number;
}
