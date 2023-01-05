type NavigatorWithSetAppBadge = Navigator & {
  setAppBadge: (count?: number) => Promise<void>
}

const isSetAppBadgeSupported = (navigator: Navigator): navigator is NavigatorWithSetAppBadge => 'setAppBadge' in navigator

export default isSetAppBadgeSupported
