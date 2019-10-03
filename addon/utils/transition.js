// https://github.com/twbs/bootstrap/blob/2fb6ccf95183cef502445a77610a27c9dc8390b2/js/src/util/index.js#L47-L71
const MILLISECONDS_MULTIPLIER = 1000;
function getTransitionDurationFromElement(element) {
  if (!element) {
    return 0
  }

  // Get transition-duration of the element
  let {
    transitionDuration,
    transitionDelay
  } = window.getComputedStyle(element)

  const floatTransitionDuration = parseFloat(transitionDuration)
  const floatTransitionDelay = parseFloat(transitionDelay)

  // Return 0 if element or transition duration is not found
  if (!floatTransitionDuration && !floatTransitionDelay) {
    return 0
  }

  // If multiple durations are defined, take the first
  transitionDuration = transitionDuration.split(',')[0]
  transitionDelay = transitionDelay.split(',')[0]

  return (parseFloat(transitionDuration) + parseFloat(transitionDelay)) * MILLISECONDS_MULTIPLIER
}

export {
  getTransitionDurationFromElement
}
