export interface MacrosState {
  stored: Macro[];
}

export interface Macro {
  name: string;
  visible?: boolean;
}
