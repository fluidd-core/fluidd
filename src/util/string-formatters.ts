import { upperFirst } from 'lodash-es'
import { getAllLocales } from '@/plugins/i18n'

const stringFormatters = () => {
  const instance = {
    prettyCase: (value: string) => {
      return value
        .split(/[ _]/g)
        .filter(x => x)
        .map(upperFirst)
        .join(' ')
    },

    /**
   * Splits a string into an array of strings, removing quotes.
   */
    getStringArray: (value: string, separator = ';') => {
      return value.split(separator)
        .map(x => x.replace(/^"|"$/g, ''))
    },

    /**
   * Formats a number (in bytes) to a human readable file size.
   */
    getReadableFileSizeString: (fileSizeInBytes: number, fractionDigits = 1) => {
      let i = -1
      const byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB']
      if (fileSizeInBytes === 0) return `0${byteUnits[0]}`
      do {
        fileSizeInBytes = fileSizeInBytes / 1024
        i++
      } while (fileSizeInBytes > 1024)

      return Math.max(fileSizeInBytes, 0.1).toFixed(fractionDigits) + byteUnits[i]
    },

    /**
   * Formats a number (in bytes/sec) to a human readable data rate.
   */
    getReadableDataRateString: (dataRateInBytesPerSec: number, fractionDigits = 1) => {
      let i = -1
      const byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB']
      if (dataRateInBytesPerSec === 0) return `0${byteUnits[0]}`
      do {
        dataRateInBytesPerSec = dataRateInBytesPerSec / 1024
        i++
      } while (dataRateInBytesPerSec > 1024)

      return Math.max(dataRateInBytesPerSec, 0.2).toFixed(fractionDigits) + byteUnits[i] + '/Sec'
    },

    /**
   * Formats a number representing mm to human readable distance.
   */
    getReadableLengthString: (lengthInMm: number | undefined | null, showMicrons = false) => {
      if (lengthInMm === undefined || lengthInMm === null) {
        return '-'
      }

      if (lengthInMm >= 1000) return (lengthInMm / 1000).toFixed(2) + ' m'
      if (lengthInMm > 100) return (lengthInMm / 10).toFixed(1) + ' cm'
      if (lengthInMm < 0.1 && showMicrons) return (lengthInMm * 1000).toFixed(0) + ' μm'
      return lengthInMm.toFixed(1) + ' mm'
    },

    /**
   * Formats a number representing g to human readable weight.
   */
    getReadableWeightString: (weightInG: number | undefined | null, fractionDigits = 2) => {
      if (weightInG === undefined || weightInG === null) {
        return '-'
      }

      if (weightInG >= 1000) return (weightInG / 1000).toFixed(fractionDigits) + ' kg'
      return weightInG.toFixed(fractionDigits) + ' g'
    },

    /**
   * Formats a number (in Hz) to a human readable frequency.
   */
    getReadableFrequencyString: (frequencyInHz: number, fractionDigits = 0) => {
      let i = 0
      const frequencyUnits = [' Hz', ' kHz', ' MHz', ' GHz', ' THz']
      while (frequencyInHz >= 1000) {
        frequencyInHz = frequencyInHz / 1000
        i++
      }
      return frequencyInHz.toFixed(fractionDigits) + frequencyUnits[i]
    },

    /**
   * Formats a number (in ohms) to a human readable resistance.
   */
    getReadableResistanceString: (resistanceInOhms: number, fractionDigits = 1) => {
      let i = 0
      const resistanceUnits = [' Ω', ' kΩ', ' MΩ', ' GΩ', ' TΩ']
      while (resistanceInOhms >= 1000) {
        resistanceInOhms = resistanceInOhms / 1000
        i++
      }
      return resistanceInOhms.toFixed(fractionDigits) + resistanceUnits[i]
    },

    /**
   * Formats a number (in hPa) to human readable atmospheric pressure.
   */
    getReadableAtmosphericPressureString: (pressumeInHPa: number, fractionDigits = 1) => {
      return pressumeInHPa.toFixed(fractionDigits) + ' hPa'
    },

    getReadableCurrencyString: (value: number, currency: string, options?: Intl.NumberFormatOptions) => {
      try {
        return value.toLocaleString(getAllLocales(), {
          style: 'currency',
          currency,
          notation: 'standard',
          ...options
        })
      } catch {
        const valueAsString = value.toFixed(2)

        return currency
          ? `${valueAsString} ${currency}`
          : valueAsString
      }
    }
  }

  return instance
}

export default stringFormatters
