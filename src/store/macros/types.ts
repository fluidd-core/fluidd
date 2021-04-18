export interface MacrosState {
  stored: Macro[];
  categories: string[];
  expanded: number[];
}

export interface Macro {
  name: string;
  visible?: boolean;
  category?: string;
  color?: string;
  config?: any;
}

export interface MacroCategory {
  name: string;
  count: number;
  visible: number;
}
