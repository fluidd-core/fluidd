/* eslint-disable-all typescript-eslint/no-var-requires */
import Vue from 'vue'
import axios from 'axios'
import { DayJSPlugin } from '@/plugins/dayjs'

axios.defaults.adapter = require('axios/lib/adapters/xhr')

Vue.config.productionTip = false
Vue.config.devtools = false

// ===
// Register Plugins
// ===
Vue.use(DayJSPlugin)
