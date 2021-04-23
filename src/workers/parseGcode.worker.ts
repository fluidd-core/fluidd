import { expose } from 'threads/worker'
import parseGcode from './parseGcode'

expose(parseGcode)
