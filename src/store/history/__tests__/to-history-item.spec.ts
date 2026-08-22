import { createHistoryJob, installTestFilters } from '@/../tests/unit/store'
import toHistoryItem from '../to-history-item'

describe('toHistoryItem', () => {
  beforeAll(() => {
    installTestFilters()
  })

  it('leaves a job without metadata alone', () => {
    const item = toHistoryItem(createHistoryJob({ job_id: '000001' }))

    expect(item.job_id).toBe('000001')
    expect(item.metadata).toBeUndefined()
  })

  it('converts a moonraker modified date to a unix time', () => {
    const item = toHistoryItem(createHistoryJob({
      job_id: '000001',
      metadata: {
        modified: '2026-08-09T12:00:00.000Z',
        size: 1024
      }
    }))

    expect(item.metadata?.modified).toBe(1786276800)
  })

  it('passes a numeric modified date through', () => {
    const item = toHistoryItem(createHistoryJob({
      job_id: '000001',
      metadata: {
        modified: 1786276800,
        size: 1024
      }
    }))

    expect(item.metadata?.modified).toBe(1786276800)
  })

  it('splits filament_name and filament_type into arrays', () => {
    const item = toHistoryItem(createHistoryJob({
      job_id: '000001',
      metadata: {
        modified: 0,
        size: 1024,
        filament_name: 'Black PLA;Red PLA',
        filament_type: 'PLA;PLA'
      }
    }))

    expect(item.metadata?.filament_name).toStrictEqual(['Black PLA', 'Red PLA'])
    expect(item.metadata?.filament_type).toStrictEqual(['PLA', 'PLA'])
  })

  it('omits filament fields that the job does not carry', () => {
    const item = toHistoryItem(createHistoryJob({
      job_id: '000001',
      metadata: {
        modified: 0,
        size: 1024
      }
    }))

    expect(item.metadata?.filament_name).toBeUndefined()
    expect(item.metadata?.filament_type).toBeUndefined()
  })
})
