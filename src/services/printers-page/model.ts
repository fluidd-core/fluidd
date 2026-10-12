import type { Directory, DirectoryEntry } from '@/services/muon-cloud/directory'
import type { PrinterStatus } from '@/services/muon-cloud/state'
import { printerNameParts } from '@/util/printer-name'
import type { ForeignStatus } from '@/services/foreign-printers/types'

/** What a printer is doing, in the words the page uses. */
export type TileState = 'printing' | 'paused' | 'ready' | 'error' | 'locked' | 'connecting' | 'unreachable' | 'offline' | 'new'

/** The colour a state is shown in: teal running, green ready, amber needs you, red fault, grey off, blue new. */
export type TileTone = 'run' | 'ok' | 'warn' | 'err' | 'off' | 'info'

/** A print, as far as this browser can see it. */
export interface TileJob {
  file: string | null;
  /** 0 to 100. */
  progress: number | null;
  secondsLeft: number | null;
  layer: number | null;
  layers: number | null;
  nozzle: number | null;
  bed: number | null;
}

export interface PrinterTile {
  key: string;
  entry: DirectoryEntry;
  name: string;
  suffix: string | null;
  state: TileState;
  tone: TileTone;
  /** The pill: Ready, 42%, Paused, Offline. */
  label: string;
  /** The line under the name. */
  detail: string;
  /** Through Muon3D, rather than on this network. */
  remote: boolean;
  job: TileJob | null;
  /** The group it is in, for the printing cards. */
  groupName: string | null;
}

export interface TileGroup {
  id: string;
  name: string;
  tiles: PrinterTile[];
  /** "1 printing · 2 ready", "All ready", "1 needs you". */
  summary: string;
  summaryTone: TileTone;
  /** One of your account's groups, which can be renamed, removed and dropped into. */
  editable: boolean;
}

export interface PrintersPage {
  printingNow: PrinterTile[];
  groups: TileGroup[];
  found: PrinterTile[];
  offline: PrinterTile[];
  other: PrinterTile[];
  counts: { printers: number, printing: number, ready: number, needsYou: number, offline: number, found: number };
  /** Nothing saved, linked or found: the page welcomes. */
  welcome: boolean;
}

export interface PageSources {
  directory: Directory;
  /** The account's groups, by cloud printer id (U6). */
  groups: Array<{ id: string, name: string, printers: string[] }>;
  /** Live state of the account's printers, read over Iroh. */
  status: Record<string, PrinterStatus>;
  /** The print on the printer Fluidd is on now, from its own socket. */
  activeJob: TileJob | null;
  signedIn: boolean;
  foreign?: DirectoryEntry[];
}

function stateOf (e: DirectoryEntry, status: Record<string, PrinterStatus>): TileState {
  if (e.foreign) {
    const state = e.foreign.status?.state ?? 'connecting'
    return state === 'idle' ? 'ready' : state === 'offline' ? 'offline' : state
  }
  if (e.section === 'found' && e.row?.action === 'set-up') return 'new'
  // Online at the service, but this browser could not reach it: the way in
  // failed, not the printer, so it is not one that needs you.
  // Only when its health came from that way in: a printer Fluidd is on
  // locally has its own socket's health, and a fault there is a fault.
  const s = e.cloud && e.active !== 'local' ? status[e.cloud.id] : undefined
  if (e.health === 'error' && s && !s.reachable) return 'unreachable'
  switch (e.health) {
    case 'printing': return 'printing'
    case 'paused': return 'paused'
    case 'online': return 'ready'
    case 'error': return 'error'
    case 'locked': return 'locked'
    case 'offline': return 'offline'
    case 'available': return e.section === 'found' ? 'ready' : 'connecting'
    default: return 'connecting'
  }
}

const TONES: Record<TileState, TileTone> = {
  printing: 'run',
  paused: 'warn',
  ready: 'ok',
  error: 'err',
  locked: 'warn',
  connecting: 'off',
  unreachable: 'off',
  offline: 'off',
  new: 'info'
}

/** Paused and faulted printers want someone. */
export function needsYou (state: TileState): boolean {
  return state === 'paused' || state === 'error'
}

function cloudJob (s: PrinterStatus | undefined): TileJob | null {
  if (!s || !s.reachable || !s.filename) return null
  const progress = typeof s.progress === 'number' ? Math.floor(s.progress * 100) : null
  const elapsed = s.printDuration ?? 0
  const secondsLeft = s.progress && s.progress > 0 && elapsed > 0
    ? Math.max(0, elapsed / s.progress - elapsed)
    : null
  return {
    file: s.filename,
    progress,
    secondsLeft,
    layer: s.layer ?? null,
    layers: s.totalLayers ?? null,
    nozzle: s.extruder ? Math.round(s.extruder.temperature) : null,
    bed: s.bed ? Math.round(s.bed.temperature) : null
  }
}

/** A file's name without its folders and extension: bracket_v2, not prints/bracket_v2.gcode. */
export function jobName (file: string | null): string | null {
  if (!file) return null
  const base = file.split('/').pop() ?? file
  return base.replace(/\.(gcode|g|gco|bgcode)$/i, '')
}

function tileFor (e: DirectoryEntry, src: PageSources, groupName: string | null): PrinterTile {
  const state = stateOf(e, src.status)
  const foreign = e.foreign?.status as ForeignStatus | null | undefined
  const job = foreign
    ? {
        file: foreign.file,
        progress: foreign.progress === null ? null : Math.floor(foreign.progress * 100),
        secondsLeft: foreign.timeLeft,
        layer: null,
        layers: null,
        nozzle: foreign.temps.find(t => t.id === 'nozzle')?.actual ?? null,
        bed: foreign.temps.find(t => t.id === 'bed')?.actual ?? null
      }
    : e.active ? src.activeJob : (e.cloud ? cloudJob(src.status[e.cloud.id]) : null)
  const parts = printerNameParts(e.name)
  const remote = e.active === 'cloud' || (!e.host && !!e.cloud)
  let label: string
  switch (state) {
    case 'printing': label = job?.progress != null ? `${job.progress}%` : 'Printing'; break
    case 'paused': label = 'Paused'; break
    case 'ready': label = 'Ready'; break
    case 'error': label = 'Error'; break
    case 'locked': label = 'Wants access'; break
    case 'offline': label = 'Offline'; break
    case 'unreachable': label = 'Unreachable'; break
    case 'new': label = 'New'; break
    default: label = 'Connecting'
  }
  let detail: string
  if ((state === 'printing' || state === 'paused') && job?.file) {
    detail = jobName(job.file) ?? e.detail
  } else if (state === 'ready') {
    detail = remote ? 'Remote, through Muon3D' : 'On this network'
  } else if (state === 'unreachable') {
    detail = "Online, but this browser can't reach it"
  } else {
    detail = e.detail
  }
  return {
    key: e.key,
    entry: e,
    name: parts.name,
    suffix: parts.suffix,
    state,
    tone: TONES[state],
    label,
    detail,
    remote,
    job,
    groupName
  }
}

/** "1 printing · 2 ready", or "All ready", or "1 needs you" first when any do. */
export function groupSummary (tiles: PrinterTile[]): { text: string, tone: TileTone } {
  if (!tiles.length) return { text: 'Empty', tone: 'off' }
  const count = (f: (t: PrinterTile) => boolean) => tiles.filter(f).length
  const needing = count(t => needsYou(t.state))
  const printing = count(t => t.state === 'printing')
  const ready = count(t => t.state === 'ready')
  if (needing) return { text: `${needing} needs you`, tone: 'warn' }
  if (ready === tiles.length) return { text: 'All ready', tone: 'ok' }
  const parts: string[] = []
  if (printing) parts.push(`${printing} printing`)
  if (ready) parts.push(`${ready} ready`)
  const rest = tiles.length - printing - ready
  if (rest) parts.push(`${rest} other`)
  return { text: parts.join(' · '), tone: printing ? 'run' : 'off' }
}

function group (id: string, name: string, tiles: PrinterTile[], editable: boolean): TileGroup {
  const summary = groupSummary(tiles)
  return { id, name, tiles, summary: summary.text, summaryTone: summary.tone, editable }
}

/**
 * The Printers page from what this browser knows: what is printing now,
 * your groups, what was found on this network and is not yours yet, and
 * what is offline (U6: Found and Offline fill themselves). A printer that
 * is printing shows in Printing now and stays in its group; an offline one
 * leaves its group for Offline.
 */
export function printersPage (src: PageSources): PrintersPage {
  const groups: TileGroup[] = []
  const offline: PrinterTile[] = []
  const all: PrinterTile[] = []

  const place = (tiles: PrinterTile[]) => {
    const online: PrinterTile[] = []
    for (const t of tiles) {
      all.push(t)
      if (t.state === 'offline') offline.push(t)
      else online.push(t)
    }
    return online
  }

  const cloud = src.directory.cloud
  const grouped = new Set<string>()
  for (const g of src.groups) {
    const members = g.printers
      .map(id => cloud.find(e => e.cloud?.id === id))
      .filter((e): e is DirectoryEntry => !!e && !grouped.has(e.key))
    members.forEach(e => grouped.add(e.key))
    groups.push(group(g.id, g.name, place(members.map(e => tileFor(e, src, g.name))), true))
  }
  const ungrouped = cloud.filter(e => !grouped.has(e.key))
  // Kept, even empty, while groups hold printers: it is where a printer is
  // dragged to take it out of its group.
  if (ungrouped.length || (src.groups.length && cloud.length)) {
    const name = src.groups.length ? 'Not in a group' : 'Your printers'
    groups.push(group('ungrouped', name, place(ungrouped.map(e => tileFor(e, src, null))), false))
  }
  if (src.directory.local.length) {
    groups.push(group('saved', 'Saved in this browser', place(src.directory.local.map(e => tileFor(e, src, null))), false))
  }

  const found = src.directory.found.map(e => tileFor(e, src, null))
  const other = (src.directory.foreign ?? src.foreign ?? []).map(e => tileFor(e, src, null))
  const allKnown = [...all, ...other]
  const printingNow = allKnown.filter(t => t.state === 'printing' || t.state === 'paused')
  const count = (f: (t: PrinterTile) => boolean) => allKnown.filter(f).length

  return {
    printingNow,
    groups: groups.filter(g => g.tiles.length || g.editable || g.id === 'ungrouped'),
    found,
    offline,
    other,
    counts: {
      printers: allKnown.length,
      printing: count(t => t.state === 'printing'),
      ready: count(t => t.state === 'ready'),
      needsYou: count(t => needsYou(t.state)),
      offline: count(t => t.state === 'offline'),
      found: found.length
    },
    welcome: !allKnown.length && !found.length && !src.signedIn
  }
}
