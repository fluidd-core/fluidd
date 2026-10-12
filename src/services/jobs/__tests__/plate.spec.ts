import { describe, expect, it } from 'vitest'
import { plateCheckNeeded } from '../plate'

const job = (start_time: number, status: string, filament_used: number) => ({ start_time, status, filament_used }) as never

describe('plateCheckNeeded', () => {
  it('asks when the newest job put material on the plate', () => {
    expect(plateCheckNeeded([job(1, 'completed', 900), job(2, 'cancelled', 12)])).toBe(true)
  })

  it("doesn't ask when the newest job left nothing on the plate", () => {
    expect(plateCheckNeeded([job(5, 'completed', 900), job(9, 'cancelled', 0)])).toBe(false)
  })

  it('reads the newest job by its start, whatever the order', () => {
    expect(plateCheckNeeded([job(9, 'cancelled', 0), job(5, 'completed', 900)])).toBe(false)
    expect(plateCheckNeeded([job(5, 'cancelled', 0), job(9, 'completed', 900)])).toBe(true)
  })

  it("doesn't ask while the newest job is still running", () => {
    expect(plateCheckNeeded([job(9, 'in_progress', 40)])).toBe(false)
  })

  it('asks when the history is empty or not known: it may not have loaded', () => {
    expect(plateCheckNeeded([])).toBe(true)
    expect(plateCheckNeeded(null)).toBe(true)
    expect(plateCheckNeeded(undefined)).toBe(true)
  })
})
