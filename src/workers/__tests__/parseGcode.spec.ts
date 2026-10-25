import parseGcode from '../parseGcode'
import { ExtrusionRole, MoveFlags } from '@/store/gcodePreview/types'

// a trailing newline is required; the reader only emits complete lines
const encode = (lines: readonly string[]) => new TextEncoder().encode(`${lines.join('\n')}\n`)

const parse = async (lines: readonly string[], onProgress: (filePosition: number) => void = () => {}) => {
  const encoded = encode(lines)

  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    body: new ReadableStream<Uint8Array>({
      start (controller) {
        controller.enqueue(encoded)
        controller.close()
      }
    })
  }))

  return parseGcode('test.gcode', encoded.length, onProgress)
}

describe('parseGcode', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('parses moves into a columnar store', async () => {
    const { moves } = await parse([
      'G28',
      'G1 Z0.2',
      'G1 X5 Y5',
      'G1 X10 E1'
    ])

    expect(moves.length).toBe(4)

    for (const column of [moves.x, moves.y, moves.z, moves.tool, moves.flags, moves.role, moves.speed, moves.fan, moves.filePosition]) {
      expect(column).toHaveLength(moves.length)
    }

    // i/j are truncated after the last arc move, of which there are none here
    expect(moves.i).toHaveLength(0)
    expect(moves.j).toHaveLength(0)
  })

  it('forward fills positions across moves', async () => {
    const { moves } = await parse([
      'G1 X5 Y5',
      'G1 X10',
      'G1 Y20'
    ])

    expect([...moves.x]).toEqual([5, 10, 10])
    expect([...moves.y]).toEqual([5, 5, 20])
  })

  it('packs move flags', async () => {
    const { moves } = await parse([
      'G17',
      'G1 X10 Y10 E1',
      'G10',
      'G11',
      'G2 X20 Y10 I5 J0 E2'
    ])

    expect(moves.length).toBe(4)
    expect(moves.flags[0]).toBe(MoveFlags.Extruding)
    expect(moves.flags[1]).toBe(MoveFlags.Retracting)
    expect(moves.flags[2]).toBe(MoveFlags.Extruding)
    expect(moves.flags[3]).toBe(MoveFlags.Extruding | MoveFlags.Arc | MoveFlags.Clockwise)

    expect(moves.i).toHaveLength(4)
    expect(moves.i[3]).toBe(5)
  })

  it('records strictly increasing file positions', async () => {
    const { moves } = await parse([
      'G1 X1',
      'G1 X2',
      'G1 X3',
      'G1 X4'
    ])

    for (let index = 1; index < moves.length; index++) {
      expect(moves.filePosition[index]).toBeGreaterThan(moves.filePosition[index - 1])
    }
  })

  it('keeps each layer file position aligned with its move', async () => {
    const { moves, layers } = await parse([
      'SET_PRINT_STATS_INFO CURRENT_LAYER=1',
      'G1 X10 Y10 E1',
      'SET_PRINT_STATS_INFO CURRENT_LAYER=2',
      'G1 Z0.2',
      'G1 X20 Y20 E2'
    ])

    expect(layers).toHaveLength(2)

    for (const layer of layers) {
      expect(layer.filePosition).toBe(moves.filePosition[layer.move])
    }

    // the first layer has no preceding move to anchor to
    expect(layers[0].move).toBe(0)
  })

  it('reports bounds once layers exist', async () => {
    const { bounds } = await parse([
      'SET_PRINT_STATS_INFO CURRENT_LAYER=1',
      'G1 X10 Y10 E1',
      'G1 X30 Y40 E2',
      'SET_PRINT_STATS_INFO CURRENT_LAYER=2',
      'G1 Z0.2',
      'G1 X20 Y20 E3'
    ])

    expect(bounds).toEqual({
      x: { min: 10, max: 30 },
      y: { min: 10, max: 40 }
    })
  })

  it('collects tools in sorted order', async () => {
    const { moves, tools } = await parse([
      'T1',
      'G1 X10 E1',
      'T0',
      'G1 X20 E2'
    ])

    expect(tools).toEqual([0, 1])
    expect([...moves.tool]).toEqual([1, 0])
  })

  it.each([
    ['G17', true],
    ['G18', false],
    ['G19', false]
  ])('records an arc only on the xy plane (%s)', async (planeCommand, isArc) => {
    const { moves } = await parse([
      planeCommand,
      'G2 X20 Y10 I5 J0 E1'
    ])

    expect((moves.flags[0] & MoveFlags.Arc) !== 0).toBe(isArc)
  })

  it('converts an r-form arc to centre offsets', async () => {
    const { moves } = await parse(['G2 X10 Y0 R5 E1'])

    expect(moves.flags[0] & MoveFlags.Arc).toBeTruthy()
    expect(moves.i[0]).toBeCloseTo(5, 5)
  })

  it('falls back to a line when the radius cannot span the move', async () => {
    const { moves } = await parse(['G2 X10 Y0 R1 E1'])

    expect(moves.length).toBe(1)
    expect(moves.flags[0] & MoveFlags.Arc).toBe(0)
  })

  it('returns an empty result for a file with no moves', async () => {
    const result = await parse([
      '; a comment',
      '',
      'M117 hello'
    ])

    expect(result.moves.length).toBe(0)
    expect(result.layers).toHaveLength(0)
    expect(result.parts).toHaveLength(0)
    expect(result.tools).toHaveLength(0)
    expect(result.roles).toHaveLength(0)
    expect(result.speedRange).toBeNull()
    expect(result.fanRange).toBeNull()
    expect(result.bounds).toBeNull()
    expect(result.truncated).toBe(false)
  })

  it('reports progress up to the final file position', async () => {
    const onProgress = vi.fn()
    const lines = ['G1 X1', 'G1 X2']

    await parse(lines, onProgress)

    expect(onProgress).toHaveBeenLastCalledWith(encode(lines).length)
  })

  it.each([
    ['TYPE:External perimeter', ExtrusionRole.ExternalPerimeter],
    [' FEATURE: Outer wall', ExtrusionRole.ExternalPerimeter],
    ['@AreaBegin "Skirt" 1', ExtrusionRole.Skirt],
    ['TYPE:Something new', ExtrusionRole.None]
  ])('records the role set by ;%s', async (comment, role) => {
    const { moves, roles } = await parse([
      `;${comment}`,
      'G1 X10 E1',
      'G1 X20 E2'
    ])

    expect([...moves.role]).toEqual([role, role])
    expect(roles).toEqual([role])
  })

  it.each([
    'LAYER_CHANGE',
    '\'quoted text\''
  ])('keeps the current role on ;%s', async (comment) => {
    const { moves } = await parse([
      ';TYPE:Solid infill',
      `;${comment}`,
      'G1 X10 E1'
    ])

    expect([...moves.role]).toEqual([ExtrusionRole.SolidInfill])
  })

  it('collects only the roles of extruding moves', async () => {
    const { moves, roles } = await parse([
      ';TYPE:Solid infill',
      'G1 X10 E1',
      ';TYPE:Perimeter',
      'G1 X20',
      ';TYPE:Skirt/Brim',
      'G1 X30 E2 ; trailing comment',
      '; not a role',
      'G1 X40 E3'
    ])

    expect([...moves.role]).toEqual([
      ExtrusionRole.SolidInfill,
      ExtrusionRole.Perimeter,
      ExtrusionRole.Skirt,
      ExtrusionRole.Skirt
    ])
    expect(roles).toEqual([ExtrusionRole.SolidInfill, ExtrusionRole.Skirt])
  })

  it('ignores role comments trailing a command', async () => {
    const { moves } = await parse([
      ';TYPE:Solid infill',
      'G1 X10 E1 ;TYPE:Perimeter',
      'G1 X20 E2'
    ])

    expect([...moves.role]).toEqual([ExtrusionRole.SolidInfill, ExtrusionRole.SolidInfill])
  })

  it('records sticky feedrates and the extruding speed range', async () => {
    const { moves, speedRange } = await parse([
      'G1 F1200',
      'G1 X10 E1',
      'G0 X20 F9000',
      'G1 X30 E2 F600',
      'G2 X40 Y0 I5 J0 E3 F1800',
      'G1 X50 F70000'
    ])

    expect([...moves.speed]).toEqual([1200, 9000, 600, 1800, 65535])
    expect(speedRange).toEqual({ min: 600, max: 1800, count: 3 })
  })

  it.each([
    [['G1 X10 E1 F600', 'G1 X20 E2'], { min: 600, max: 600, count: 1 }],
    [['G1 X10 E1 F600', 'G1 X20 E2 F1200', 'G1 X30 E3 F600'], { min: 600, max: 1200, count: 2 }]
  ])('counts few distinct extruding speeds exactly', async (lines, expected) => {
    const { speedRange } = await parse(lines)

    expect(speedRange).toEqual(expected)
  })

  it('records sticky fan speeds like Klipper', async () => {
    const { moves, fanRange } = await parse([
      'G1 X10 E1',
      'M106 S127',
      'G1 X20 E2',
      'G0 X30',
      'M106',
      'G1 X40 E3',
      'M106 P2 S0',
      'G1 X50 E4',
      'M106 S255',
      'G0 X60',
      'M107',
      'G1 X70 E5'
    ])

    expect([...moves.fan]).toEqual([0, 127, 127, 255, 0, 255, 0])
    expect(fanRange).toEqual({ min: 0, max: 255, count: 3 })
  })
})
