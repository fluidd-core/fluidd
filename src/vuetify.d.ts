declare module 'vuetify/lib/components' {
  interface _Loadable {
    readonly isLoading: boolean
  }

  interface _Validatable {
    readonly hasColor: boolean,
    readonly hasFocused: boolean,
    readonly hasInput: boolean,
    readonly isFocused: boolean,
    readonly isResetting: boolean,
    readonly valid: boolean,
    reset: () => void,
    resetValidation: () => void,
    validate: (force?: boolean, value?: any) => boolean
  }

  interface _Toggleable {
    readonly isActive: boolean,
  }

  interface _Groupable {
    activeClass: string,
    readonly isActive: boolean,
    disabled: boolean,
    readonly groupClasses: object,
    readonly toggle: (e?: Event) => void
  }

  export interface VInput extends _Validatable {
    readonly $el: HTMLInputElement,
    readonly hasMouseDown: boolean
  }

  export interface VForm {
    readonly $el: HTMLFormElement,
    readonly validate: () => boolean,
    readonly reset: () => void,
    readonly resetValidation: () => void
  }

  export interface VBtn extends _Toggleable, _Groupable {
    readonly $el: HTMLElement
  }

  export interface VTextField extends VInput, _Loadable {
    readonly $refs: {
      readonly label: HTMLElement,
      readonly input: HTMLInputElement,
      readonly 'prepend-inner': HTMLElement,
      readonly prefix: HTMLElement,
      readonly suffix: HTMLElement
    }
    readonly focus: () => void,
    readonly blur: (e?: Event) => void
  }

  export interface VSlider extends VInput, _Loadable {
    readonly $refs: {
      readonly track: HTMLElement,
    },
    value: number
  }

  export interface VTextarea extends VTextField, _Validatable {
    readonly $refs: VTextField['$refs'] & {
      readonly input: HTMLTextAreaElement
    }
  }
}
