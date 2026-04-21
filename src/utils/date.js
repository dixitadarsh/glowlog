const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export function formatDate(date = new Date()) {
  const day   = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year  = date.getFullYear();
  const dayName = DAYS[date.getDay()];

  let hours   = date.getHours();
  const mins  = String(date.getMinutes()).padStart(2, '0');
  const secs  = String(date.getSeconds()).padStart(2, '0');
  const ampm  = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  return `${dayName}, ${day} ${month} ${year}  ${hours}:${mins}:${secs} ${ampm}`;
}

export function formatDateShort(date = new Date()) {
  const day   = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year  = date.getFullYear();

  let hours  = date.getHours();
  const mins = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  return `${day} ${month} ${year}  ${hours}:${mins} ${ampm}`;
}

export function formatISO(date = new Date()) {
  return date.toISOString();
}
