import axios from 'axios'
import { vi } from 'vitest'

axios.defaults.adapter = require('axios/lib/adapters/xhr')

vi.mock('vue', async () => {
  const Vue = await vi.importActual('vue') as any

  Vue.default.config.productionTip = false
  Vue.default.config.devtools = false

  return Vue
})
