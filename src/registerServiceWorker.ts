// import { register } from 'register-service-worker'
import { Workbox } from 'workbox-window'

let wb: Workbox | null

if ('serviceWorker' in navigator) {
  wb = new Workbox(`${import.meta.env.BASE_URL}service-worker.js`)

  wb.addEventListener('controlling', () => {
    window.location.reload()
  })

  wb.register()
} else {
  wb = null
}

export default wb

// Relevant read?
// https://medium.com/@stephen.trevor.wong/3-steps-to-add-pwa-to-vue-js-in-2020-9f9daa56f9
// if (import.meta.env.NODE_ENV === 'production') {
//   register(`${import.meta.env.BASE_URL}service-worker.js`, {
//     ready () {
//       consola.log(
//         'App is being served from cache by a service worker.\n' +
//         'For more details, visit https://goo.gl/AFskqB'
//       )
//     },
//     registered () {
//       consola.log('Service worker has been registered.')
//     },
//     cached () {
//       consola.log('Content has been cached for offline use.')
//     },
//     updatefound () {
//       consola.log('New content is downloading.')
//     },
//     updated () {
//       consola.log('New content is available; please refresh.')
//     },
//     offline () {
//       consola.log('No internet connection found. App is running in offline mode.')
//     },
//     error (error) {
//       consola.error('Error during service worker registration:', error)
//     }
//   })
// }
