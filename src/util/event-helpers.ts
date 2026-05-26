export const eventTargetIsContentEditable = (event: Event): boolean => {
  const target = event.target

  if (target instanceof HTMLElement) {
    const { isContentEditable, tagName, role, ariaRoleDescription } = target

    if (isContentEditable) {
      return true
    }

    const type = target instanceof HTMLInputElement
      ? target.type
      : ''
    const readOnly = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
      ? target.readOnly
      : false

    return (
      !readOnly &&
      (
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        (
          tagName === 'INPUT' &&
          !['checkbox', 'radio', 'range', 'button', 'file', 'reset', 'submit', 'color'].includes(type)
        ) ||
        (
          role === 'textbox' &&
          ariaRoleDescription === 'editor'
        )
      )
    )
  }

  return false
}

export const keyboardEventToKeyboardShortcut = (event: KeyboardEvent): string => {
  const keys: string[] = []

  if (event.ctrlKey) {
    keys.push('Ctrl')
  }

  if (event.metaKey) {
    keys.push('Meta')
  }

  if (event.altKey) {
    keys.push('Alt')
  }

  if (event.shiftKey) {
    keys.push('Shift')
  }

  keys.push(event.key)

  return keys.join('+')
}
