const eventTargetIsContentEditable = (event: KeyboardEvent): boolean => {
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

export default eventTargetIsContentEditable
