import { EventBus } from '@/eventBus'

/**
 * Normalizes a spoolman/filaman proxy response to the v2 shape.
 *
 * Lives in its own module so both `actions.ts` and `filamanActions.ts` can use it
 * without creating a circular import between them.
 */
export const payloadAsSpoolmanProxyResponseV2 = <T>(payload: Moonraker.Spoolman.ProxyResponse<T>): Moonraker.Spoolman.ProxyResponseV2<T> => {
  if (
    payload != null &&
    typeof payload === 'object' &&
    'error' in payload &&
    'response' in payload
  ) {
    if (payload.error != null) {
      EventBus.$emit(typeof payload.error === 'string' ? payload.error : payload.error.message, { type: 'error' })
    }

    return payload
  }

  return {
    error: null,
    response: payload
  }
}
