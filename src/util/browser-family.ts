export type BrowserFamily = 'chrome' | 'firefox' | 'safari' | 'other'

export function browserFamily (userAgent: string = navigator.userAgent): BrowserFamily {
  if (/Firefox\//i.test(userAgent)) return 'firefox'
  if (/Safari\//i.test(userAgent) && !/(Chrome|Chromium|CriOS|Edg|OPR)\//i.test(userAgent)) return 'safari'
  if (/(Chrome|Chromium|CriOS|Edg|OPR)\//i.test(userAgent)) return 'chrome'
  return 'other'
}

export const blocksForeignHttp = (
  protocol: string = location.protocol,
  userAgent?: string
): boolean => protocol === 'https:' && ['firefox', 'safari'].includes(browserFamily(userAgent))
