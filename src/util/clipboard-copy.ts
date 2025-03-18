import { consola } from 'consola'

const clipboardCopy = async (text: string, parentElement?: Element): Promise<boolean> => {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text)

      return true
    } catch (e) {
      consola.error('Error while copying text to clipboard', e)

      return false
    }
  }

  parentElement ??= document.body

  const textarea = document.createElement('textarea')

  textarea.value = text
  textarea.classList.add('clipboard-copy')

  parentElement.appendChild(textarea)

  try {
    textarea.focus()
    textarea.select()
    textarea.setSelectionRange(0, 99999)

    return document.execCommand('copy')
  } catch (e) {
    consola.error('Error while copying text to clipboard', e)

    return false
  } finally {
    parentElement.removeChild(textarea)
  }
}

export default clipboardCopy
