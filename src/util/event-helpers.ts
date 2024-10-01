export const eventTargetIsContentEditable = (event: Event): boolean => {
  if (event.target) {
    const { isContentEditable, tagName, type, readOnly } = event.target as HTMLInputElement

    if (isContentEditable) {
      return true
    }

    return (
      !readOnly &&
      (
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        (
          tagName === 'INPUT' &&
          !['checkbox', 'radio', 'range', 'button', 'file', 'reset', 'submit', 'color'].includes(type)
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
