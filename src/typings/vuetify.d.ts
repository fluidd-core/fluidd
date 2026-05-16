declare module 'vuetify/lib/components' {
  interface _Loadable {
    loading: boolean | string,
    loaderHeight: number | string
  }

  interface _Validatable {
    disabled: boolean,
    error: boolean,
    errorCount: number | string,
    errorMessages: string | string[],
    messages: string | string[],
    readonly: boolean,
    rules: [],
    success: boolean,
    successMessages: string | string[],
    validateOnBlur: boolean,
    readonly errorBucket: string[],
    readonly hasColor: boolean,
    readonly hasFocused: boolean,
    readonly hasInput: boolean,
    readonly isFocused: boolean,
    readonly isResetting: boolean,
    readonly valid: boolean,
    readonly hasError: boolean,
    readonly hasSuccess: boolean,
    readonly hasMessages: boolean,
    readonly isDisabled: boolean,
    readonly isReadonly: boolean,
    readonly shouldValidate: boolean,
    readonly validationState: string | undefined,
    reset: () => void,
    resetValidation: () => void,
    validate: (force?: boolean, value?: any) => boolean
  }

  interface _Toggleable {
    readonly isActive: boolean
  }

  interface _Groupable {
    activeClass: string,
    disabled: boolean,
    readonly isActive: boolean,
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
    },
    readonly focus: () => void,
    readonly blur: (e?: Event) => void
  }

  export interface VSlider extends VInput, _Loadable {
    readonly $refs: {
      readonly track: HTMLElement
    },
    value: number
  }

  export interface VTextarea extends VTextField {
    readonly $refs: VTextField['$refs'] & {
      readonly input: HTMLTextAreaElement
    },
    autoGrow: boolean,
    noResize: boolean,
    rowHeight: number | string,
    rows: number | string
  }

  export interface VSelect extends VTextField {
    readonly $refs: VTextField['$refs'] & {
      readonly content: HTMLElement,
      readonly 'append-inner': HTMLElement
    },
    multiple: boolean,
    chips: boolean,
    smallChips: boolean,
    hideSelected: boolean,
    returnObject: boolean,
    readonly isMenuActive: boolean,
    readonly selectedItems: object[]
  }

  export interface VAutocomplete extends VSelect {
    autoSelectFirst: boolean,
    noFilter: boolean,
    hideNoData: boolean,
    searchInput: string | null,
    readonly internalSearch: string | null,
    readonly filteredItems: object[],
    readonly isSearching: boolean
  }

  export interface VCombobox extends VAutocomplete {
    delimiters: string[]
  }
}
