import { ExtrusionRole } from '@/store/gcodePreview/types'

type RoleTags = [tag: string, role: ExtrusionRole][]

// tags are matched case-insensitively
const roleMap = (...tables: RoleTags[]) => new Map(
  tables.flat().map(([tag, role]) => [tag.toLowerCase(), role])
)

// "Skirt" is from 2.3.1 and earlier
const prusaSlicerTags: RoleTags = [
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
  ['Custom', ExtrusionRole.Custom]
]

// PrusaSlicer extrudes thin walls as external perimeters
const superSlicerTags: RoleTags = [
  ['Internal perimeter', ExtrusionRole.Perimeter],
  ['External perimeter', ExtrusionRole.ExternalPerimeter],
  ['Overhang perimeter', ExtrusionRole.OverhangPerimeter],
  ['Internal infill', ExtrusionRole.InternalInfill],
  ['Solid infill', ExtrusionRole.SolidInfill],
  ['Top solid infill', ExtrusionRole.TopSolidInfill],
  ['Ironing', ExtrusionRole.Ironing],
  ['Bridge infill', ExtrusionRole.BridgeInfill],
  ['Internal bridge infill', ExtrusionRole.BridgeInfill],
  ['Thin wall', ExtrusionRole.ExternalPerimeter],
  ['Gap fill', ExtrusionRole.GapFill],
  ['Skirt', ExtrusionRole.Skirt],
  ['Support material', ExtrusionRole.SupportMaterial],
  ['Support material interface', ExtrusionRole.SupportMaterialInterface],
  ['Wipe tower', ExtrusionRole.WipeTower],
  ['Custom', ExtrusionRole.Custom]
]

// PrusaSlicer maps "Bottom surface" and "Internal Bridge" to None
const orcaSlicerTags: RoleTags = [
  ['Inner wall', ExtrusionRole.Perimeter],
  ['Outer wall', ExtrusionRole.ExternalPerimeter],
  ['Overhang wall', ExtrusionRole.OverhangPerimeter],
  ['Sparse infill', ExtrusionRole.InternalInfill],
  ['Internal solid infill', ExtrusionRole.SolidInfill],
  ['Top surface', ExtrusionRole.TopSolidInfill],
  ['Bottom surface', ExtrusionRole.SolidInfill],
  ['Ironing', ExtrusionRole.Ironing],
  ['Bridge', ExtrusionRole.BridgeInfill],
  ['Internal Bridge', ExtrusionRole.BridgeInfill],
  ['Gap infill', ExtrusionRole.GapFill],
  ['Skirt', ExtrusionRole.Skirt],
  ['Brim', ExtrusionRole.Skirt],
  ['Support', ExtrusionRole.SupportMaterial],
  ['Support interface', ExtrusionRole.SupportMaterialInterface],
  ['Prime tower', ExtrusionRole.WipeTower],
  ['Custom', ExtrusionRole.Custom]
]

const bambuStudioTags: RoleTags = [
  ['Inner wall', ExtrusionRole.Perimeter],
  ['Outer wall', ExtrusionRole.ExternalPerimeter],
  ['Overhang wall', ExtrusionRole.OverhangPerimeter],
  ['Sparse infill', ExtrusionRole.InternalInfill],
  ['Floating vertical shell', ExtrusionRole.SolidInfill],
  ['Internal solid infill', ExtrusionRole.SolidInfill],
  ['Top surface', ExtrusionRole.TopSolidInfill],
  ['Bottom surface', ExtrusionRole.SolidInfill],
  ['Ironing', ExtrusionRole.Ironing],
  ['Support ironing', ExtrusionRole.Ironing],
  ['Bridge', ExtrusionRole.BridgeInfill],
  ['Gap infill', ExtrusionRole.GapFill],
  ['Skirt', ExtrusionRole.Skirt],
  ['Brim', ExtrusionRole.Skirt],
  ['Support', ExtrusionRole.SupportMaterial],
  ['Support interface', ExtrusionRole.SupportMaterialInterface],
  ['Prime tower', ExtrusionRole.WipeTower],
  ['Custom', ExtrusionRole.Custom]
]

const curaTags: RoleTags = [
  ['WALL-OUTER', ExtrusionRole.ExternalPerimeter],
  ['WALL-INNER', ExtrusionRole.Perimeter],
  ['SKIN', ExtrusionRole.SolidInfill],
  ['SUPPORT', ExtrusionRole.SupportMaterial],
  ['SKIRT', ExtrusionRole.Skirt],
  ['FILL', ExtrusionRole.InternalInfill],
  ['SUPPORT-INTERFACE', ExtrusionRole.SupportMaterialInterface],
  ['PRIME-TOWER', ExtrusionRole.WipeTower]
]

// from PrusaSlicer's ProcessorImpl.cpp, except "BOTTOM-SURFACE", which it maps to None
const ideaMakerTags: RoleTags = [
  ['BOTTOM-SURFACE', ExtrusionRole.SolidInfill],
  ['BRIDGE', ExtrusionRole.BridgeInfill],
  ['FILL', ExtrusionRole.InternalInfill],
  ['GAP-FILL', ExtrusionRole.GapFill],
  ['RAFT', ExtrusionRole.Skirt],
  ['SOLID-FILL', ExtrusionRole.SolidInfill],
  ['SKIRT', ExtrusionRole.Skirt],
  ['SUPPORT', ExtrusionRole.SupportMaterial],
  ['TOP-SURFACE', ExtrusionRole.TopSolidInfill],
  ['WALL-OUTER', ExtrusionRole.ExternalPerimeter],
  ['WALL-INNER', ExtrusionRole.Perimeter]
]

export const typeRoleTags = [prusaSlicerTags, superSlicerTags, orcaSlicerTags, bambuStudioTags, curaTags, ideaMakerTags]

const typeRoles = roleMap(...typeRoleTags)

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
