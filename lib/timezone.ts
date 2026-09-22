/** Timezone utilities for consistent America/Sao_Paulo handling */

const SAO_PAULO = "America/Sao_Paulo";

/** Format a Unix timestamp (ms) to a human-readable date/time string in São Paulo timezone */
export function formatDateTime(value:number|null):string{
  if(!value)return "";
  return new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short",timeZone:SAO_PAULO}).format(value);
}

/** Format a Unix timestamp (ms) to a date-only string in São Paulo timezone */
export function formatDate(value:number|null):string{
  if(!value)return "";
  return new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeZone:SAO_PAULO}).format(value);
}

/** Format a Unix timestamp (ms) to an ISO-like string suitable for datetime-local inputs,
 *  adjusted to São Paulo timezone offset. */
export function toInputDateTime(value:number|null):string{
  if(!value)return "";
  // Build a date string in São Paulo timezone using Intl parts
  const parts=new Intl.DateTimeFormat("en-US",{
    year:"numeric",month:"2-digit",day:"2-digit",
    hour:"2-digit",minute:"2-digit",hour12:false,
    timeZone:SAO_PAULO
  }).formatToParts(new Date(value));
  const get=(type:Intl.DateTimeFormatPartTypes)=>parts.find(p=>p.type===type)?.value||"00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Parse a datetime-local input string as if the user is in São Paulo timezone,
 *  returning a Unix timestamp (ms). Appends -03:00 offset (standard BRT).
 *  Note: This is an approximation; DST rules for Brazil were abolished in 2019. */
export function fromInputDateTime(value:string):number|null{
  if(!value)return null;
  // datetime-local gives us "YYYY-MM-DDTHH:MM" — interpret as São Paulo
  // Brazil ended DST in 2019, so UTC-3 is the year-round offset for Brasília
  const iso=value+":00-03:00";
  const time=Date.parse(iso);
  if(!Number.isFinite(time))return null;
  return time;
}

/** Get the current time as a Unix timestamp (ms). Useful for server-side consistency. */
export function nowMs():number{return Date.now()}
