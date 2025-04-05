import { upperFirst } from 'lodash-es'
import { getAllLocales } from '@/plugins/i18n'

const stringFormatters = () => {
  const byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB']

  const frequencyUnits = [' Hz', ' kHz', ' MHz', ' GHz', ' THz']

  const resistanceUnits = [' Ω', ' kΩ', ' MΩ', ' GΩ', ' TΩ']

  const instance = {
    prettyCase: (value: string) => {
      return value
        .split(/[ _]/g)
        .filter(x => x)
        .map(upperFirst)
        .join(' ')
    },

    getPixelsString: (value: number | string | undefined | null) => {
      if (value == null || value === '') {
        return undefined
      }

      const valueAsNumber = +value

      if (isNaN(valueAsNumber)) {
        return value.toString()
      }

      return `${valueAsNumber}px`
    },

    getStringValueWithUnit: (value: number, fractionDigits: number, unit: string) => {
      if (value === 0) {
        return `0${unit}`
      }

      return Math.max(value, Math.pow(10, -fractionDigits))
        .toFixed(fractionDigits) + unit
    },

    /**
     * Splits a string into an array of strings, removing quotes.
     */
    getStringArray: (value: string, separator = ';') => {
      if (value.startsWith('["') && value.endsWith('"]')) {
        try {
          return JSON.parse(value) as string[]
        } catch {
        }
      }

      return value.split(separator)
        .map(x => x.replace(/^"|"$/g, ''))
    },

    /**
     * Formats a number (in bytes) to a human readable file size.
     */
    getReadableFileSizeString: (fileSizeInBytes: number, fractionDigits = 1) => {
      let i = -1
      do {
        fileSizeInBytes = fileSizeInBytes / 1024
        i++
      } while (fileSizeInBytes > 1024)

      return instance.getStringValueWithUnit(fileSizeInBytes, fractionDigits, byteUnits[i])
    },

    /**
     * Formats a number (in bytes/sec) to a human readable data rate.
     */
    getReadableDataRateString: (dataRateInBytesPerSec: number, fractionDigits = 1) => {
      let i = -1
      do {
        dataRateInBytesPerSec = dataRateInBytesPerSec / 1024
        i++
      } while (dataRateInBytesPerSec > 1024)

      return instance.getStringValueWithUnit(dataRateInBytesPerSec, fractionDigits, byteUnits[i] + '/Sec')
    },

    /**
     * Formats a number representing mm to human readable distance.
     */
    getReadableLengthString: (lengthInMm: number, options?: { showMicrons?: boolean, showKilometers?: boolean }, fractionDigits: number | undefined = undefined) => {
      if (lengthInMm >= 1000000 && options?.showKilometers) {
        return (lengthInMm / 1000000).toFixed(fractionDigits ?? 2) + ' km'
      }

      if (lengthInMm >= 1000) {
        return (lengthInMm / 1000).toFixed(fractionDigits ?? 2) + ' m'
      }

      if (lengthInMm > 100) {
        return (lengthInMm / 10).toFixed(fractionDigits ?? 1) + ' cm'
      }

      if (lengthInMm < 0.1 && options?.showMicrons) {
        return instance.getStringValueWithUnit(lengthInMm * 1000, fractionDigits ?? 0, ' μm')
      }

      return instance.getStringValueWithUnit(lengthInMm, fractionDigits ?? 1, ' mm')
    },

    /**
     * Formats a number representing g to human readable weight.
     */
    getReadableWeightString: (weightInG: number, fractionDigits = 2) => {
      if (weightInG >= 1000) {
        return (weightInG / 1000).toFixed(fractionDigits) + ' kg'
      }

      return instance.getStringValueWithUnit(weightInG, fractionDigits, ' g')
    },

    /**
     * Formats a number (in Hz) to a human readable frequency.
     */
    getReadableFrequencyString: (frequencyInHz: number, fractionDigits = 0) => {
      let i = 0
      while (frequencyInHz >= 1000) {
        frequencyInHz = frequencyInHz / 1000
        i++
      }

      return instance.getStringValueWithUnit(frequencyInHz, fractionDigits, frequencyUnits[i])
    },

    /**
     * Formats a number (in ohms) to a human readable resistance.
     */
    getReadableResistanceString: (resistanceInOhms: number, fractionDigits = 1) => {
      let i = 0
      while (resistanceInOhms >= 1000) {
        resistanceInOhms = resistanceInOhms / 1000
        i++
      }

      return instance.getStringValueWithUnit(resistanceInOhms, fractionDigits, resistanceUnits[i])
    },

    /**
     * Formats a number (in hPa) to human readable atmospheric pressure.
     */
    getReadableAtmosphericPressureString: (pressumeInHPa: number, fractionDigits = 1) => {
      return instance.getStringValueWithUnit(pressumeInHPa, fractionDigits, ' hPa')
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
