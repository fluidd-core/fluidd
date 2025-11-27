import { parseArgs } from 'node:util'
import { readFile, writeFile, glob } from 'node:fs/promises'
import { optimize as svgoOptimize } from 'svgo'
import svgoConfig from '../svgo.config.mjs'

const filesWithMdiSvgs = new Set([
  'src/globals.ts'
])

const writeFileIfContentChanged = async (path, before, after) => {
  if (before === after) {
    return
  }

  console.log(`Optimized SVG paths in ${path}
  Before:  ${before.length} bytes
  After:   ${after.length} bytes
  Saved:   ${before.length - after.length} bytes, ${(after.length / before.length * 100).toFixed(2)}%`)

  await writeFile(path, after, { encoding: 'utf8' })
}

const optimizeSvgPath = (inputSvgPath) => {
  const { data } = svgoOptimize(`<path d="${inputSvgPath}"/>`, svgoConfig)

  const startIndex = data.indexOf('d="') + 3
  const endIndex = data.lastIndexOf('"')

  const outputSvgPath = data.slice(startIndex, endIndex)

  return outputSvgPath
}

const optimizeSvgFile = async (file) => {
  const contentBefore = await readFile(file, { encoding: 'utf8' })

  const { data: contentAfter } = svgoOptimize(contentBefore, svgoConfig)

  await writeFileIfContentChanged(file, contentBefore, contentAfter)
}

const optimizeVueFile = async (file) => {
  const contentBefore = await readFile(file, { encoding: 'utf8' })

  const contentAfter = contentBefore.replaceAll(/(<path[^>]* d=")([^"]*)"/g, (match, head, inputSvgPath) => {
    const outputSvgPath = optimizeSvgPath(inputSvgPath)

    return `${head}${outputSvgPath}"`
  })

  await writeFileIfContentChanged(file, contentBefore, contentAfter)
}

const optimizeGlobalsTsFile = async (file) => {
  const contentBefore = await readFile(file, { encoding: 'utf8' })

  const contentAfter = contentBefore.replaceAll(/(const mdi\S+ = ')([^']*)'/g, (match, head, inputSvgPath) => {
    const outputSvgPath = optimizeSvgPath(inputSvgPath)

    return `${head}${outputSvgPath}'`
  })

  await writeFileIfContentChanged(file, contentBefore, contentAfter)
}

(async () => {
  const { positionals: patterns } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true
  })

  for await (const filename of glob(patterns)) {
    if (filename.endsWith('.svg')) {
      await optimizeSvgFile(filename)
    } else if (filename.endsWith('.vue')) {
      await optimizeVueFile(filename)
    } else if (filesWithMdiSvgs.has(filename)) {
      await optimizeGlobalsTsFile(filename)
    }
  }
})()
