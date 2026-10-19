import Vue from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  askToChange,
  completeChange,
  readAnswer,
  refusalOf,
  whoMayAsk,
  whyNot,
  DevModeRefused,
  DevModeRequestUnavailable,
  DEV_MODE_REQUEST_PATH
} from '../request'
import { CHALLENGE, FakePrinter, OWNER, WAIVER, moonrakerError } from './fakePrinter'

let printer: FakePrinter

beforeEach(() => {
  printer = new FakePrinter()
  ;(Vue as unknown as { $httpClient: unknown }).$httpClient = printer
})

describe('a developer-mode request, through Moonraker\'s one route for it (KAN-547)', () => {
  it('asks who may ask without putting anything on the printer\'s screen', async () => {
    expect(await whoMayAsk()).toEqual({
      asOwner: true,
      owner: { linked: true, account: OWNER },
      mayAsk: true,
      waiver: WAIVER
    })
    expect(printer.get).toHaveBeenCalledWith(DEV_MODE_REQUEST_PATH, { params: undefined })
    expect(printer.post).not.toHaveBeenCalled()
    expect(printer.opened).toEqual([])
  })

  it('on a linked printer, says only the owner may ask, and names them', async () => {
    printer.asOwner = false
    const asking = await whoMayAsk()
    expect(asking.mayAsk).toBe(false)
    expect(whyNot(asking)).toBe(`Only ${OWNER} can change developer mode on this printer, from one of their own devices. Each change is confirmed on the printer's screen.`)

    printer.linked = null
    expect(whyNot(await whoMayAsk())).toMatch(/can't tell yet whether an account owns it/)

    printer.linked = false
    const open = await whoMayAsk()
    expect(open.mayAsk).toBe(true)
    expect(whyNot(open)).toBeNull()
  })

  it('opens, follows and completes a change, each through the same route', async () => {
    printer.devMode = true
    const challenge = await askToChange(false)
    expect(printer.post).toHaveBeenLastCalledWith(DEV_MODE_REQUEST_PATH, { enabled: false })
    expect(challenge).toMatchObject({ challengeId: CHALLENGE, enabled: false, expiresInSeconds: 120 })

    expect(await readAnswer(CHALLENGE)).toEqual({ confirmed: false, refused: false })
    expect(printer.get).toHaveBeenLastCalledWith(DEV_MODE_REQUEST_PATH, { params: { challenge_id: CHALLENGE } })

    printer.confirm()
    expect(await readAnswer(CHALLENGE)).toEqual({ confirmed: true, refused: false })
    expect(await completeChange({ enabled: false, challengeId: CHALLENGE })).toEqual({ enabled: false })
    // Turning off takes no waiver (DEV-5).
    expect(printer.completed).toEqual([{ enabled: false, challenge_id: CHALLENGE }])
    expect(printer.devMode).toBe(false)
  })

  it('turning on acknowledges the waiver shown', async () => {
    printer.confirm()
    await completeChange({ enabled: true, challengeId: CHALLENGE, waiverVersion: WAIVER.version })
    expect(printer.completed).toEqual([{
      enabled: true, challenge_id: CHALLENGE, waiver_acknowledged: true, waiver_version: WAIVER.version
    }])
  })

  it('reads the printer\'s refusal code and keeps its words', async () => {
    printer.asOwner = false
    const error = await askToChange(true).catch(e => e)
    expect(error).toBeInstanceOf(DevModeRefused)
    expect(error.code).toBe('owner_required')
    expect(error.status).toBe(403)
    expect(error.message).toMatch(new RegExp(`^Only ${OWNER} can change developer mode`))

    printer.asOwner = true
    const early = await completeChange({ enabled: true, challengeId: CHALLENGE, waiverVersion: 'w-1' }).catch(e => e)
    expect(early).toMatchObject({ code: 'confirmation_required', status: 428 })
  })

  it('tells a printer without the route from a refusal', async () => {
    printer.routeMissing = true
    expect(await whoMayAsk().catch(e => e)).toBeInstanceOf(DevModeRequestUnavailable)
    // A 404 the route itself explains is not a missing route.
    expect(refusalOf(moonrakerError(404, 'dev-mode:challenge_not_found: No such challenge.')))
      .toMatchObject({ code: 'challenge_not_found' })
    // A refusal with no code (muon-link's own 403 for a Viewer, say) keeps its text.
    expect(refusalOf({ response: { status: 403, data: 'muon-link refused this request' } }))
      .toMatchObject({ code: 'refused', message: 'muon-link refused this request' })
    const network = new Error('Network Error')
    expect(refusalOf(network)).toBe(network)
  })

  it('never sends an id that could name another route', async () => {
    for (const bad of ['../dev_mode', 'a/b', 'a%2Fb', '', 'x?y=1', 'short']) {
      await expect(readAnswer(bad)).rejects.toThrow('not a challenge id')
      await expect(completeChange({ enabled: false, challengeId: bad })).rejects.toThrow('not a challenge id')
    }
    expect(printer.get).not.toHaveBeenCalled()
    expect(printer.post).not.toHaveBeenCalled()
  })
})
