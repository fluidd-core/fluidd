const getVueApp = () => {
  return (document.querySelector('#app') as any).__vue__
}

export default getVueApp
