#!/usr/bin/env node
// Bundle size manifest generator + comparator, used by the CI bundle-size report.
//
// Usage:
//   node tools/bundle-size.mjs generate <dist-dir> <out.json>
//   node tools/bundle-size.mjs compare <base.json> <head.json>
//
// No dependencies — only node:fs, node:path and node:zlib. Sizes are gzip'd since
// server/nginx/default.conf.template serves assets gzipped; that's the number that
// matters for what a browser actually downloads.

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join, relative, sep } from 'node:path'

// Vite/rolldown content hashes are always 8 chars of [A-Za-z0-9_-], immediately
// before the extension (e.g. `setupMonaco-BGNH_NaM.js` -> `setupMonaco-*.js`).
// Stripping exactly 8 (not "8 or more") avoids false-positives on names that
// merely end in enough letters, e.g. `editor.worker-D9zwrD0f.js`'s `.worker` part.
const HASH_RE = /-[\w-]{8}(\.[a-z0-9]+)$/

function stripHash (filename) {
  return filename.replace(HASH_RE, '-*$1')
}

function walk (distDir) {
  const entries = {}

  for (const entry of readdirSync(distDir, { recursive: true, withFileTypes: true })) {
    if (entry.isDirectory() || !/\.(?:js|css)$/.test(entry.name)) continue

    const full = join(entry.parentPath, entry.name)
    const raw = statSync(full).size
    const gzip = gzipSync(readFileSync(full), { level: 9 }).length
    const relDir = relative(distDir, entry.parentPath).split(sep).join('/')
    const key = (relDir ? `${relDir}/` : '') + stripHash(entry.name)

    // A hash collision after stripping (unlikely, but not impossible for tiny
    // chunks) would silently overwrite — sum instead so nothing goes missing.
    if (entries[key]) {
      entries[key] = { raw: entries[key].raw + raw, gzip: entries[key].gzip + gzip }
    } else {
      entries[key] = { raw, gzip }
    }
  }

  return entries
}

function generate (distDir, outFile) {
  const entries = walk(distDir)
  const manifest = { generatedAt: new Date().toISOString(), entries }

  writeFileSync(outFile, JSON.stringify(manifest, null, 2))

  const count = Object.keys(entries).length
  console.error(`Wrote ${count} entries to ${outFile}`)
}

function formatBytes (bytes) {
  if (bytes === 0) return '0 B'

  const units = ['B', 'kB', 'MB']
  let value = Math.abs(bytes)
  let unit = 0

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }

  const formatted = unit === 0 ? String(Math.round(value)) : value.toFixed(1)

  return `${bytes < 0 ? '-' : ''}${formatted} ${units[unit]}`
}

function formatDelta (bytes) {
  if (bytes === 0) return '±0 B'

  return `${bytes > 0 ? '+' : ''}${formatBytes(bytes)}`
}

function compare (baseFile, headFile) {
  const base = JSON.parse(readFileSync(baseFile, 'utf8')).entries
  const head = JSON.parse(readFileSync(headFile, 'utf8')).entries

  const keys = new Set([...Object.keys(base), ...Object.keys(head)])

  const rows = [...keys].map(key => {
    const baseGzip = base[key]?.gzip ?? null
    const headGzip = head[key]?.gzip ?? null
    const delta = (headGzip ?? 0) - (baseGzip ?? 0)
    const status = baseGzip == null ? 'added' : headGzip == null ? 'removed' : 'changed'

    return { key, baseGzip, headGzip, delta, status }
  })

  const changed = rows
    .filter(row => row.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.key.localeCompare(b.key))

  const totalBase = rows.reduce((sum, row) => sum + (row.baseGzip ?? 0), 0)
  const totalHead = rows.reduce((sum, row) => sum + (row.headGzip ?? 0), 0)
  const totalDelta = totalHead - totalBase

  const lines = []

  lines.push('## Bundle size report (gzip)')
  lines.push('')

  if (changed.length === 0) {
    lines.push('No chunk size changes detected.')
  } else {
    lines.push('| Chunk | Base | Head | Δ |')
    lines.push('|---|---|---|---|')

    for (const row of changed) {
      const chunk = row.status === 'added'
        ? `${row.key} 🆕`
        : row.status === 'removed'
          ? `${row.key} 🗑️`
          : row.key

      lines.push(`| \`${chunk}\` | ${row.baseGzip == null ? '—' : formatBytes(row.baseGzip)} | ${row.headGzip == null ? '—' : formatBytes(row.headGzip)} | ${formatDelta(row.delta)} |`)
    }

    lines.push(`| **Total** | **${formatBytes(totalBase)}** | **${formatBytes(totalHead)}** | **${formatDelta(totalDelta)}** |`)
  }

  lines.push('')
  lines.push(`<sub>${rows.length} chunks compared, ${changed.length} changed. Sizes are gzip, matching what nginx serves.</sub>`)

  console.log(lines.join('\n'))
}

const [, , command, ...args] = process.argv

switch (command) {
  case 'generate': {
    const [distDir, outFile] = args
    if (!distDir || !outFile) {
      console.error('Usage: bundle-size.mjs generate <dist-dir> <out.json>')
      process.exit(1)
    }
    generate(distDir, outFile)
    break
  }

  case 'compare': {
    const [baseFile, headFile] = args
    if (!baseFile || !headFile) {
      console.error('Usage: bundle-size.mjs compare <base.json> <head.json>')
      process.exit(1)
    }
    compare(baseFile, headFile)
    break
  }

  default:
    console.error('Usage: bundle-size.mjs <generate|compare> ...')
    process.exit(1)
}
