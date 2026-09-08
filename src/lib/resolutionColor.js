const RED = [220, 38, 38]
const PALE_RED = [252, 165, 165]
const PALE_GREEN = [134, 239, 172]
const GREEN = [22, 163, 74]

function mix(from, to, amount) {
  return `rgb(${from.map((channel, index) => channel + (to[index] - channel) * amount).join(', ')})`
}

// Keep the exact percentage for the threshold and interpolate within each ramp.
export function resolutionColor(percentage) {
  const rate = Math.max(0, Math.min(100, percentage))
  return rate < 50
    ? mix(RED, PALE_RED, rate / 50)
    : mix(PALE_GREEN, GREEN, (rate - 50) / 50)
}

export const resolutionGradient = `linear-gradient(to right, ${mix(RED, RED, 0)} 0%, ${mix(PALE_RED, PALE_RED, 0)} 50%, ${resolutionColor(50)} 50%, ${resolutionColor(100)} 100%)`
