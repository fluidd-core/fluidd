import { ExtrusionRole } from '@/store/gcodePreview/types'

// tags are matched case-insensitively
const roleMap = (entries: [string, ExtrusionRole][]) => new Map(
  entries.map(([tag, role]) => [tag.toLowerCase(), role])
)

// Based on PrusaSlicer's ProcessorImpl.cpp tables, except "Bottom surface" and
// "Internal bridge", which PrusaSlicer maps to None
const typeRoles = roleMap([
  ['Perimeter', ExtrusionRole.Perimeter],
  ['External perimeter', ExtrusionRole.ExternalPerimeter],
  ['Overhang perimeter', ExtrusionRole.OverhangPerimeter],
  ['Internal infill', ExtrusionRole.InternalInfill],
  ['Solid infill', ExtrusionRole.SolidInfill],
  ['Top solid infill', ExtrusionRole.TopSolidInfill],
  ['Ironing', ExtrusionRole.Ironing],
  ['Bridge infill', ExtrusionRole.BridgeInfill],
  ['Gap fill', ExtrusionRole.GapFill],
  ['Skirt', ExtrusionRole.Skirt],
  ['Skirt/Brim', ExtrusionRole.Skirt],
  ['Support material', ExtrusionRole.SupportMaterial],
  ['Support material interface', ExtrusionRole.SupportMaterialInterface],
  ['Wipe tower', ExtrusionRole.WipeTower],
  ['Custom', ExtrusionRole.Custom],

  ['Bottom surface', ExtrusionRole.SolidInfill],
  ['Bridge', ExtrusionRole.BridgeInfill],
  ['Brim', ExtrusionRole.Skirt],
  ['Gap infill', ExtrusionRole.GapFill],
  ['Inner wall', ExtrusionRole.Perimeter],
  ['Internal bridge', ExtrusionRole.BridgeInfill],
  ['Internal solid infill', ExtrusionRole.SolidInfill],
  ['Outer wall', ExtrusionRole.ExternalPerimeter],
  ['Overhang wall', ExtrusionRole.OverhangPerimeter],
  ['Prime tower', ExtrusionRole.WipeTower],
  ['Sparse infill', ExtrusionRole.InternalInfill],
  ['Support', ExtrusionRole.SupportMaterial],
  ['Support interface', ExtrusionRole.SupportMaterialInterface],
  ['Top surface', ExtrusionRole.TopSolidInfill],

  ['FILL', ExtrusionRole.InternalInfill],
  ['PRIME-TOWER', ExtrusionRole.WipeTower],
  ['SKIN', ExtrusionRole.SolidInfill],
  ['SUPPORT-INTERFACE', ExtrusionRole.SupportMaterialInterface],
  ['WALL-OUTER', ExtrusionRole.ExternalPerimeter],
  ['WALL-INNER', ExtrusionRole.Perimeter],
  ['GAP-FILL', ExtrusionRole.GapFill],
  ['RAFT', ExtrusionRole.Skirt],
  ['SOLID-FILL', ExtrusionRole.SolidInfill],
  ['TOP-SURFACE', ExtrusionRole.TopSolidInfill]
])

const simplify3dRoles = roleMap([
  ['bridge', ExtrusionRole.BridgeInfill],
  ['dense support', ExtrusionRole.SupportMaterialInterface],
  ['gap fill', ExtrusionRole.GapFill],
  ['infill', ExtrusionRole.SolidInfill],
  ['inner perimeter', ExtrusionRole.Perimeter],
  ['outer perimeter', ExtrusionRole.ExternalPerimeter],
  ['prime pillar', ExtrusionRole.WipeTower],
  ['raft', ExtrusionRole.Skirt],
  ['skirt', ExtrusionRole.Skirt],
  ['solid layer', ExtrusionRole.SolidInfill],
  ['support', ExtrusionRole.SupportMaterial]
])

const kisslicerRoles = roleMap([
  ['Perimeter', ExtrusionRole.ExternalPerimeter],
  ['Raft', ExtrusionRole.Skirt],
  ['Sparse Infill', ExtrusionRole.SolidInfill],
  ['Stacked Sparse Infill', ExtrusionRole.InternalInfill],
  ['Support (may Stack)', ExtrusionRole.SupportMaterial],
  ['Support Interface', ExtrusionRole.SupportMaterialInterface],
  ['Travel/Ironing', ExtrusionRole.Ironing]
])

const craftwareRoles = roleMap([
  ['Bridge', ExtrusionRole.BridgeInfill],
  ['Brim', ExtrusionRole.Skirt],
  ['Infill', ExtrusionRole.InternalInfill],
  ['Ironing', ExtrusionRole.Ironing],
  ['Perimeter', ExtrusionRole.ExternalPerimeter],
  ['Pillar', ExtrusionRole.WipeTower],
  ['Raft', ExtrusionRole.Skirt],
  ['Skirt', ExtrusionRole.Skirt],
  ['Support', ExtrusionRole.SupportMaterial],
  ['SupportInterface', ExtrusionRole.SupportMaterialInterface]
])

const kisslicerRegExp = /^'([^']+) Path'/
const craftwareRegExp = /^@AreaBegin\s*"([^"]*)"/

export const parseExtrusionRoleComment = (comment: string): ExtrusionRole | undefined => {
  if (comment.startsWith('TYPE:')) {
    return typeRoles.get(comment.substring(5).trim().toLowerCase()) ?? ExtrusionRole.None
  }

  if (comment.startsWith('FEATURE:')) {
    return typeRoles.get(comment.substring(8).trim().toLowerCase()) ?? ExtrusionRole.None
  }

  if (comment.startsWith('feature ')) {
    return simplify3dRoles.get(comment.substring(8).trim().toLowerCase()) ?? ExtrusionRole.None
  }

  if (comment.startsWith('\'')) {
    const match = kisslicerRegExp.exec(comment)

    if (match) {
      return kisslicerRoles.get(match[1].toLowerCase()) ?? ExtrusionRole.None
    }
  } else if (comment.startsWith('@AreaBegin')) {
    const match = craftwareRegExp.exec(comment)

    return (match && craftwareRoles.get(match[1].toLowerCase())) ?? ExtrusionRole.None
  }

  return undefined
}
