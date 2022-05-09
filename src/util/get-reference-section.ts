const extruderRegExp = /^extruder[0-9]+$/

const getReferenceSection = (sectionName: string) => {
  if (sectionName.startsWith('stepper_')) {
    return 'stepper'
  }

  if (extruderRegExp.test(sectionName)) {
    return 'extruder'
  }

  return sectionName
}

export default getReferenceSection
