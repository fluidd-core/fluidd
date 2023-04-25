import { consola, LogLevels } from 'consola'

// Configure Consola
consola.wrapAll()
consola.level = LogLevels.warn

if (import.meta.env.DEV) consola.level = LogLevels.verbose
