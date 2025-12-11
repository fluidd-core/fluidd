import type { Globals } from '@/globals'

export interface PrinterState {
  info: Moonraker.Printer.Info | null;
  manualProbeDialogOpen: boolean;
  bedScrewsAdjustDialogOpen: boolean;
  screwsTiltAdjustDialogOpen: boolean;
  forceMoveEnabled: boolean;
  printer: Klipper.PrinterState;
}

export interface KnownExtruder {
  name: string;
  key: Klipper.ExtruderKey;
}

export interface Extruder extends Klipper.ExtruderState {
  key: string;
  config: Klipper.ExtruderSettings;
  min_extrude_temp: number;
  disconnected: boolean;
}

type StepperType<T> = {
  config?: T;
  name: string;
  prettyName: string;
  key: string;
  enabled?: boolean;
  disconnected: boolean;
}

export interface ExtruderStepper extends StepperType<Klipper.ExtruderStepperSettings> {
  motion_queue?: Klipper.ExtruderKey | null;
  pressure_advance?: number;
  smooth_time?: number;
}

export interface Stepper extends StepperType<Klipper.ExtruderSettings | Klipper.ExtruderStepperSettings | Klipper.StepperSettings> {
}

export interface MCU extends Klipper.McuState {
  name: string;
  prettyName: string;
  key: string;
  config?: Klipper.McuSettings;
}

type OutputType<TConfig extends TSHelpers.ValueTypesOf<Klipper.SettingsStateBaseType>, TState extends TSHelpers.ValueTypesOf<Klipper.PrinterStateBaseType>> = TState & {
  config?: TConfig;
  name: string;
  prettyName: string;
  key: string;
  color?: string;
  type: string;
  disconnected: boolean;
}

export type Heater = (
  OutputType<Klipper.HeaterGenericSettings, Klipper.HeaterGenericState> |
  OutputType<Klipper.HeaterBedSettings, Klipper.HeaterBedState> |
  OutputType<Klipper.ExtruderSettings, Klipper.ExtruderState>
) & {
  minTemp: number;
  maxTemp: number;
}

export type Fan = (
  OutputType<Klipper.FanSettings, Klipper.FanState> |
  OutputType<Klipper.ControllerFanSettings, Klipper.FanState> |
  OutputType<Klipper.HeaterFanSettings, Klipper.FanState> |
  OutputType<Klipper.FanSettings, Klipper.TemperatureFanState>
) & {
  controllable: boolean;
  minTemp?: number;
  maxTemp?: number;
}

export type Led = OutputType<Klipper.LedSettings, Klipper.LedState> & {
  controllable: boolean;
}

export type OutputPin = OutputType<Klipper.OutputPinSettings, Klipper.OutputPinState> & {
  controllable: boolean;
  pwm: boolean;
  scale: number;
  resetValue: number;
}

export interface Sensor extends Partial<Klipper.TemperatureSensorState>, Partial<Klipper.TemperatureSensor2State>, Partial<Klipper.ZThermalAdjustState> {
  name: string;
  prettyName: string;
  key: string;
  color?: string;
  type: string;
  maxTemp?: number;
  minTemp?: number;
  disconnected: boolean;
}

export interface RunoutSensor extends Partial<Klipper.FilamentSwitchSensorState>, Partial<Klipper.FilamentMotionSensorState> {
  name: string;
  prettyName: string;
}

export interface Endstop {
  name: string;
  prettyName: string;
  state: number;
}

export interface Probe extends Klipper.ProbeState {
  name: string;
  prettyName: string;
}

export interface BedScrews extends Partial<Klipper.BedScrewsState> {
  screws: BedScrewsScrew[];
}

export interface BedScrewsScrew {
  key: string;
  name: string;
  prettyName: string;
  x: number;
  y: number;
}

export interface ScrewsTiltAdjust extends Partial<Omit<Klipper.ScrewsTiltAdjustState, 'results'>> {
  screws: ScrewsTiltAdjustScrew[]
}

export interface ScrewsTiltAdjustScrew {
  key: string;
  name: string;
  prettyName: string;
  adjustMinutes: number;
  relativeZ?: number;
  x: number;
  y: number;
  z: number;
  sign: 'CW' | 'CCW';
  adjust: string;
  is_base: boolean;
}

export interface BedSize {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface GcodeCommands extends Record<string, GcodeCommand> {
}

export interface GcodeCommand {
  help?: string
}

export interface TimeEstimates {
  progress: number;
  printDuration: number;
  totalDuration: number;
  fileLeft: number;
  slicerLeft: number;
  actualLeft: number;
  eta: number;
}

export interface BeaconModel {
  name: string;
  active: boolean;
}

export type SupportedKlipperServices = keyof typeof Globals.SUPPORTED_SERVICES.KLIPPER

export interface KlippyApp {
  name: SupportedKlipperServices;
  isKalico: boolean;
  isKalicoOrDangerKlipper: boolean;
  domain: string;
  minVersion: string;
}

export interface ExcludeObjectPart extends Klipper.PrinterExcludeObjectObjectState {
  isExcluded: boolean;
  isCurrent: boolean;
}
