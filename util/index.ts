export function timeAgo (value: string | Date): string {
  const seconds = Math.floor((new Date().getTime() - new Date(value).getTime()) / 1000)
  let interval = seconds / 31536000
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (interval > 1) { return rtf.format(-Math.floor(interval), 'year') }
  interval = seconds / 2592000
  if (interval > 1) { return rtf.format(-Math.floor(interval), 'month') }
  interval = seconds / 86400
  if (interval > 1) { return rtf.format(-Math.floor(interval), 'day') }
  interval = seconds / 3600
  if (interval > 1) { return rtf.format(-Math.floor(interval), 'hour') }
  interval = seconds / 60
  if (interval > 1) { return rtf.format(-Math.floor(interval), 'minute') }
  return rtf.format(-Math.floor(interval), 'second')
}

export const isEqual = (first: any, second: any): boolean => {
  if (first === second) {
    return true
  }
  if ((first == null || second == null) && (first != null || second != null)) {
    return false
  }
  const firstType = first?.constructor.name
  const secondType = second?.constructor.name
  if (firstType !== secondType) {
    return false
  }
  if (firstType === 'Array') {
    if (first.length !== second.length) {
      return false
    }
    let equal = true
    for (let i = 0; i < first.length; i++) {
      if (!isEqual(first[i], second[i])) {
        equal = false
        break
      }
    }
    return equal
  }
  if (firstType === 'Object') {
    let equal = true
    const fKeys = Object.keys(first)
    const sKeys = Object.keys(second)
    if (fKeys.length !== sKeys.length) {
      return false
    }
    for (let i = 0; i < fKeys.length; i++) {
      if (first[fKeys[i]] && second[fKeys[i]]) { // eslint-disable-line @typescript-eslint/strict-boolean-expressions
        if (first[fKeys[i]] === second[fKeys[i]]) {
          continue; // eslint-disable-line
        }
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (first[fKeys[i]] && (first[fKeys[i]].constructor.name === 'Array' ||
          first[fKeys[i]].constructor.name === 'Object')) {
          equal = isEqual(first[fKeys[i]], second[fKeys[i]])
          if (!equal) {
            break
          }
        } else if (first[fKeys[i]] !== second[fKeys[i]]) {
          equal = false
          break
        }
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      } else if ((first[fKeys[i]] && !second[fKeys[i]]) || (!first[fKeys[i]] && second[fKeys[i]])) {
        equal = false
        break
      }
    }
    return equal
  }
  return first === second
}

export function randomIntFromInterval (min: number, max: number): number { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

// WARNING: This is not a drop in replacement solution and
// it might not work for some edge cases. Test your code!
export const debounce = (func: Function, delay: number, { leading }: { leading?: boolean } = {}): (...args: any[]) => any => {
  let timerId: NodeJS.Timeout | null = null

  return (...args: any[]) => {
    if (timerId == null && leading === true) {
      func(...args)
    }
    if (timerId != null) {
      clearTimeout(timerId)
      timerId = null
    }

    timerId = setTimeout(() => func(...args), delay)
  }
}

export const timeIt = async (callback: () => Promise<void>): Promise<number> => {
  const start = Date.now()
  await callback()
  const end = Date.now()
  return end - start
}

export const HOUR_IN_MS = 60 * 60 * 1000
export const MAX_USER_AGED_DAYS = +(process.env.MAX_USER_AGED_DAYS ?? 60)
export const DAYS_BETWEEN_NOTIFICATION_AND_DELETE = +(process.env.DAYS_BETWEEN_NOTIFICATION_AND_DELETE7 ?? 7)

export const daysToMilliseconds = (days: number): number => days * 24 * HOUR_IN_MS

export const millisecondsToDays = (ms: number): number => Math.floor(ms / (24 * HOUR_IN_MS))
