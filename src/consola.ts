import Consola from 'consola'

// Configure Consola
Consola.wrapAll()
Consola.level = 1

if (import.meta.env.DEV) Consola.level = 6
