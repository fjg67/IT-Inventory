const relativeFormat = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });
const exactFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

export function formatComputerDate(value: string, now = Date.now()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const current = new Date(now);
  const seconds = (date.getTime() - now) / 1000;
  const absolute = Math.abs(seconds);
  const unit: Intl.RelativeTimeFormatUnit = absolute < 3600 ? 'minute' : absolute < 86400 ? 'hour'
    : absolute < 30 * 86400 ? 'day' : absolute < 365 * 86400 ? 'month' : 'year';
  const divisor = { minute: 60, hour: 3600, day: 86400, month: 30 * 86400, year: 365 * 86400 }[unit];
  return {
    label: absolute < 60 ? 'à l’instant' : relativeFormat.format(Math.trunc(seconds / divisor), unit),
    exact: exactFormat.format(date),
    today: date.getFullYear() === current.getFullYear() && date.getMonth() === current.getMonth() && date.getDate() === current.getDate(),
  };
}
