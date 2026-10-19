import { ControlPreferenceStore, validatePreferences, type ControlPreferences, type PreferenceContext, type PreferenceRemote } from '@/services/control/preferences'
import { accountRequest } from './client'

async function request (context: PreferenceContext, folds?: Record<string, boolean>): Promise<ControlPreferences> {
  if (!context.accountId || !context.token || !context.printerId) throw new Error('Sign in to sync your choices.')
  // Explicit credentials disable accountRequest's retry with the current person.
  const value = await accountRequest<unknown>(folds ? 'PATCH' : 'GET', `/v1/me/control-preferences/${encodeURIComponent(context.printerId)}${folds ? '' : '?version=2'}`,
    folds ? { version: 1, folds } : undefined, { token: context.token })
  validatePreferences(value)
  return value
}

export const controlPreferenceRemote: PreferenceRemote = {
  read: context => request(context),
  patch: (context, folds) => request(context, folds),
  patchLayout: async (context, cards) => {
    if (!context.accountId || !context.token || !context.printerId) throw new Error('Sign in to sync your Overview.')
    const value = await accountRequest<unknown>('PATCH', `/v1/me/control-preferences/${encodeURIComponent(context.printerId)}`,
      { version: 2, folds: {}, overview: { cards } }, { token: context.token })
    validatePreferences(value)
    return value
  }
}

export const controlPreferenceStore = new ControlPreferenceStore(controlPreferenceRemote, {
  getItem: key => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value)
} as Storage)
