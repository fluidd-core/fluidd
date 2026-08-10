const decimalRound = (value: number, places: number): number => {
  const factor = 10 ** places

  return Math.round(value * factor) / factor
}

export default decimalRound
