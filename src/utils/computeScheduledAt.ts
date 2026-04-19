/**
 * Converts a local date/time in the given IANA timezone to a UTC Date.
 */
function zonedToUTC(
  year: number,
  month: number,
  day: number,
  hour: number,
  timezone: string
): Date {
  // Step 1: guess — treat the desired local time as if it were UTC
  const guess = new Date(Date.UTC(year, month - 1, day, hour, 0, 0));

  // Step 2: ask Intl what local clock shows for that UTC moment in the timezone
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(guess);

  const get = (type: string) => {
    const val = Number(parts.find((p) => p.type === type)?.value ?? 0);
    // Intl returns 24 for midnight when hour12:false
    return type === 'hour' && val === 24 ? 0 : val;
  };

  // Step 3: express that local clock reading as a UTC timestamp
  const localShownAsUTC = new Date(
    Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  );

  // Step 4: offset = how far the guess was off
  const offset = guess.getTime() - localShownAsUTC.getTime();

  return new Date(Date.UTC(year, month - 1, day, hour, 0, 0) + offset);
}

/**
 * Returns the next occurrence of the given hour (default 6) local time on the
 * given month/day in the specified IANA timezone (e.g. "America/Sao_Paulo").
 */
export function computeScheduledAt(month: number, day: number, timezone: string, hour = 6): Date {
  const now = new Date();
  const currentYear = now.getFullYear();

  const thisYear = zonedToUTC(currentYear, month, day, hour, timezone);
  if (thisYear > now) return thisYear;

  return zonedToUTC(currentYear + 1, month, day, hour, timezone);
}
