export interface LayoutState {
  layouts: Layouts;
}

/**
 * As single layout. Should have at least one container.
 * Configuration id's should not be duplicated across containers.
**/
export interface Layouts {
  [index: string]: LayoutContainer;
}

/** Containers, each of which is an array of configurations. */
export interface LayoutContainer {
  [index: string]: LayoutConfig[];
}

/** Configuration of a layout item */
export interface LayoutConfig {
  id: string;
  enabled: boolean;
  collapsed: boolean;
  layout?: string;
  container?: string;
}
