export type VForm = Vue & {
  validate: () => boolean;
  reset: () => boolean;
  resetValidation: () => boolean;
}

export type VSlider = Vue & {
  value: number
}
