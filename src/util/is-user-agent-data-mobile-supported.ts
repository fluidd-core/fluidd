type NavigatorWithUserAgentDataMobile = Navigator & {
  userAgentData: {
    mobile: boolean
  }
}

const isUserAgentDataMobileSupported = (navigator: Navigator): navigator is NavigatorWithUserAgentDataMobile => {
  return (
    navigator.userAgentData != null &&
    'mobile' in navigator.userAgentData &&
    typeof navigator.userAgentData.mobile === 'boolean'
  )
}

export default isUserAgentDataMobileSupported
