const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const pad = n => String(n).padStart(2,'0');

export function formatTimestamp(format = 'HH:MM:SS', date = new Date()) {
  if (!format) return '';

  const h24  = date.getHours();
  const h12  = h24 % 12 || 12;
  const mm   = pad(date.getMinutes());
  const ss   = pad(date.getSeconds());
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const DD   = date.getDate();
  const Mon  = MONTHS_SHORT[date.getMonth()];
  const Month= MONTHS_LONG[date.getMonth()];
  const YYYY = date.getFullYear();

  switch (format) {
    case 'HH:MM:SS':         return `${pad(h24)}:${mm}:${ss}`;
    case 'HH:MM':            return `${pad(h24)}:${mm}`;
    case 'hh:MM:SS AM':      return `${pad(h12)}:${mm}:${ss} ${ampm}`;
    case 'DD Mon HH:MM:SS':  return `${DD} ${Mon} ${pad(h24)}:${mm}:${ss}`;
    case 'DD Month YYYY HH:MM AM': return `${DD} ${Month} ${YYYY}  ${h12}:${mm} ${ampm}`;
    case 'ISO':              return date.toISOString();
    default:                 return `${pad(h24)}:${mm}:${ss}`;
  }
}

export function formatFileDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
}

export function formatFileHour(date = new Date()) {
  return `${formatFileDate(date)}_${pad(date.getHours())}h`;
}
