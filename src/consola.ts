import Consola from 'consola'

// Configure Consola
Consola.wrapAll()
Consola.level = 1

if (process.env.NODE_ENV === 'development') Consola.level = 6
