const frames: {[feature: string]: any} = {}

export default function (code: string, feature?: string): any {
  let frame
  if (feature) {
    if (frames[feature]) frame = frames[feature]
    else if (!frames[feature]) frames[feature] = frame = createFrame()
  } else frame = createFrame()

  const result = (new (frame.contentWindow as any).Function(code))()

  if (!feature) frame.remove()
  return result
}

export function createFrame () {
  const frame = document.createElement('iframe')

  frame.style.display = 'none'
  document.body.appendChild(frame) // needed for contentWindow

  return frame
}
