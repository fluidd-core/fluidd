export default function (code: string): any {
  const frame = document.createElement('iframe')

  frame.style.display = 'none'
  document.body.appendChild(frame) // needed for contentWindow

  const result = (new (frame.contentWindow as any).Function(code))()
  frame.remove()

  return result
}
