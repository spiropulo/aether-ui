/**
 * IANA timezone ids for labor reporting Settings when Intl.supportedValuesOf is unavailable.
 */
const FALLBACK = [
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'America/Anchorage',
  'America/Bogota',
  'America/Buenos_Aires',
  'America/Caracas',
  'America/Chicago',
  'America/Denver',
  'America/Edmonton',
  'America/Halifax',
  'America/Lima',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/New_York',
  'America/Phoenix',
  'America/Santiago',
  'America/Sao_Paulo',
  'America/St_Johns',
  'America/Toronto',
  'America/Vancouver',
  'Asia/Bangkok',
  'Asia/Dubai',
  'Asia/Hong_Kong',
  'Asia/Jakarta',
  'Asia/Kolkata',
  'Asia/Manila',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Taipei',
  'Asia/Tel_Aviv',
  'Asia/Tokyo',
  'Australia/Adelaide',
  'Australia/Brisbane',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Sydney',
  'Europe/Amsterdam',
  'Europe/Athens',
  'Europe/Berlin',
  'Europe/Brussels',
  'Europe/Dublin',
  'Europe/Helsinki',
  'Europe/Istanbul',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Moscow',
  'Europe/Paris',
  'Europe/Prague',
  'Europe/Rome',
  'Europe/Stockholm',
  'Europe/Vienna',
  'Europe/Warsaw',
  'Europe/Zurich',
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Guam',
  'Pacific/Honolulu',
  'UTC',
]

/**
 * All IANA timezones supported by the runtime, sorted, or {@link FALLBACK}.
 */
export function getIanaTimezoneOptions() {
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
      return [...Intl.supportedValuesOf('timeZone')].sort((a, b) => a.localeCompare(b))
    }
  } catch {
    /* ignore */
  }
  return [...FALLBACK].sort((a, b) => a.localeCompare(b))
}

/**
 * Group "Region/City" zones by region for optgroup labels.
 */
export function groupTimezonesByRegion(zones) {
  const groups = new Map()
  for (const z of zones) {
    const slash = z.indexOf('/')
    const region = slash === -1 ? 'Other' : z.slice(0, slash)
    if (!groups.has(region)) groups.set(region, [])
    groups.get(region).push(z)
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
}
