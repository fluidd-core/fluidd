export type VForm = Vue & HTMLFormElement & {
  validate: () => boolean;
  resetValidation: () => boolean;
}

export type VInput = Vue & HTMLInputElement & {
  validate: (force?: boolean) => boolean;
  valid: boolean
}

export type VSlider = VInput & {
  value: number
}
