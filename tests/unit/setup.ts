import Vue from 'vue'
import axios from 'axios'
import { DayJSPlugin } from '@/plugins/dayjs'
import { vi } from 'vitest'

axios.defaults.adapter = require('axios/lib/adapters/xhr')

Vue.use(DayJSPlugin)

vi.mock('vue', async () => {
  const Vue = await vi.importActual('vue') as any

  Vue.default.config.productionTip = false
  Vue.default.config.devtools = false

  return Vue
})
