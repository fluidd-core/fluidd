export interface MacrosState {
  stored: Macro[];
  categories: MacroCategory[];
  expanded: number[];
}

export interface Macro {
  name: string;
  alias?: string;
  visible: boolean;
  categoryId?: string;
  category?: MacroCategory;
  assignTo?: string;
  disabledWhilePrinting?: boolean;
  color?: string;
  config?: any;
  order?: number;
  variables?: Record<string, any>
}

export interface MacroCategory {
  id: string;
  name: string;
  count?: number;
  visible?: number;
}

export interface KObject {
  name: string;
  state: any;
  config: any;
}
