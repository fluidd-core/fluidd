export interface NaviPoint {
  title: string;
  href: string;
  target?: string;
  icon: string;
  position: number;
  visible?: boolean;
}

export interface PluginsState {
  naviPoints: NaviPoint[];
  naviPointsLoaded: boolean;
}
