export type VForm = Vue & {
  validate: () => boolean;
  reset: () => boolean;
  resetValidation: () => boolean;
}
