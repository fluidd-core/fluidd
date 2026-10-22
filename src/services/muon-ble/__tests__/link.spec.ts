import { afterEach, describe, expect, it } from 'vitest'
import { bluetoothRouteFor, cappedSegment, MAX_WRITE_SEGMENT, openBleLink, stopUsingBluetoothFor, takesBleLinks, useBluetoothFor } from '../link'
import { EID, fakeEndpoint, fakePrinter, info, OTHER_EID } from './fakes'

afterEach(() => {
  stopUsingBluetoothFor(EID)
})

describe('openBleLink', () => {
  it("joins the GATT connection to the endpoint: INFO's segment size, HELLO out on RX, the reply in on TX", async () => {
    const printer = fakePrinter({ infoValue: info(0, 244) })
    const { endpoint, links } = fakeEndpoint()
    const link = await openBleLink(endpoint, printer.device)
    expect(link.printerId).toBe(EID)
    expect(endpoint.addLink).toHaveBeenCalledWith('central', 244)
    expect(printer.calls).toContain('notify')
    expect(printer.written[0]).toEqual(new Uint8Array([1]))
    expect(links[0].received).toEqual([new Uint8Array([2])])
    expect(link.isOpen()).toBe(true)
    await link.disconnect()
  })

  it('caps the segment size at 244 even when INFO says 512 (BlueZ drops 512-byte writes)', async () => {
    const printer = fakePrinter({ infoValue: info(0, 512) })
    const { endpoint } = fakeEndpoint()
    const link = await openBleLink(endpoint, printer.device)
    expect(endpoint.addLink).toHaveBeenCalledWith('central', MAX_WRITE_SEGMENT)
    expect(MAX_WRITE_SEGMENT).toBe(244)
    await link.disconnect()
  })

  it('keeps a smaller INFO segment size, and leaves an unknown one to the endpoint', () => {
    expect(cappedSegment(182)).toBe(182)
    expect(cappedSegment(244)).toBe(244)
    expect(cappedSegment(245)).toBe(244)
    expect(cappedSegment(0)).toBeUndefined()
  })

  it('hangs up with BYE, then drops the GATT connection', async () => {
    const printer = fakePrinter()
    const { endpoint } = fakeEndpoint()
    const link = await openBleLink(endpoint, printer.device)
    await link.disconnect()
    await link.closed
    expect(printer.written[printer.written.length - 1]).toEqual(new Uint8Array([3]))
    expect(printer.calls[printer.calls.length - 1]).toBe('disconnect')
    expect(link.isOpen()).toBe(false)
  })

  it('closes the link when the radio drops', async () => {
    const printer = fakePrinter()
    const { endpoint, links } = fakeEndpoint()
    const link = await openBleLink(endpoint, printer.device)
    printer.drop()
    await link.closed
    expect(links[0].isClosed()).toBe(true)
  })

  it('refuses a printer whose HELLO names another printer than its INFO', async () => {
    const printer = fakePrinter()
    const { endpoint } = fakeEndpoint(OTHER_EID)
    await expect(openBleLink(endpoint, printer.device)).rejects.toThrow(/different printers/)
    expect(printer.calls[printer.calls.length - 1]).toBe('disconnect')
  })

  it('gives up when HELLO gets no answer, and frees the device for another try', async () => {
    const printer = fakePrinter({ answers: false })
    const { endpoint } = fakeEndpoint()
    await expect(openBleLink(endpoint, printer.device, { helloTimeoutMs: 50 })).rejects.toThrow(/handshake timed out/)
    expect(printer.calls[printer.calls.length - 1]).toBe('disconnect')
    // The failed attempt does not hold the device: a second one gets as far as HELLO again.
    await expect(openBleLink(endpoint, printer.device, { helloTimeoutMs: 50 })).rejects.toThrow(/handshake timed out/)
  })

  it('refuses a second link to a device that has one', async () => {
    const printer = fakePrinter()
    const { endpoint } = fakeEndpoint()
    const link = await openBleLink(endpoint, printer.device)
    await expect(openBleLink(endpoint, printer.device)).rejects.toThrow(/already connected/)
    await link.disconnect()
  })
})

describe('the Bluetooth route', () => {
  it('opens a link only for a printer the person asked to open over Bluetooth', async () => {
    const printer = fakePrinter()
    const { endpoint } = fakeEndpoint()
    expect(await bluetoothRouteFor(endpoint, EID)).toBeNull()
    useBluetoothFor(EID, printer.device)
    const link = await bluetoothRouteFor(endpoint, EID)
    expect(link?.printerId).toBe(EID)
    // Reused while it is up.
    expect(await bluetoothRouteFor(endpoint, EID)).toBe(link)
    expect(endpoint.addLink).toHaveBeenCalledTimes(1)
  })

  it('does nothing with an endpoint that takes no Bluetooth links (the console before muon-link#31)', async () => {
    const printer = fakePrinter()
    useBluetoothFor(EID, printer.device)
    expect(takesBleLinks({ connect () {} })).toBe(false)
    expect(await bluetoothRouteFor({ connect () {} }, EID)).toBeNull()
    expect(printer.calls).toEqual([])
  })

  it('hangs up on a printer nearby that is not the one asked for', async () => {
    const printer = fakePrinter({ infoValue: info(0, 182, OTHER_EID) })
    const { endpoint } = fakeEndpoint(OTHER_EID)
    useBluetoothFor(EID, printer.device)
    await expect(bluetoothRouteFor(endpoint, EID)).rejects.toThrow(/not the one asked for/)
    expect(printer.calls[printer.calls.length - 1]).toBe('disconnect')
  })
})
