export type VForm = Vue & HTMLFormElement & {
  resetValidation: () => void,
  validate: () => boolean,
}

export type VInput = Vue & HTMLInputElement & {
  hasColor: boolean,
  hasFocused: boolean,
  hasInput: boolean,
  hasMouseDown: boolean,
  isFocused: boolean,
  isResetting: boolean,
  reset: () => void,
  resetValidation: () => void,
  valid: boolean,
  validate: (force?: boolean) => boolean,
}

export type VSlider = VInput & {
  value: number,
}
