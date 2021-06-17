export default (el: HTMLElement) => {
  el.onfocus = (ev) => {
    const target = ev.target as HTMLElement
    target.blur()
    // console.log('called blur', target)
  }
}
