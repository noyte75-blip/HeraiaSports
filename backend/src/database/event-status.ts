export interface RegistrationRecord {
  id?: string; is_demo: boolean; date: string | Date; registration_status?: string;
  registration_checked_at?: string | Date | null; registration_deadline?: string | Date | null;
  registration_url?: string; source_url?: string;
}
export type Availability = 'open_checked' | 'needs_review' | 'closed' | 'demo';
// A dated editorial check is not a live feed. Never keep announcing an old check as open.
export function eventAvailability(event:RegistrationRecord, now = new Date()): Availability {
  if (event.is_demo) return 'demo';
  if (new Date(event.date).getTime() <= now.getTime() || event.registration_status === 'closed'
      || (event.registration_deadline && new Date(event.registration_deadline).getTime() <= now.getTime())) return 'closed';
  const checked = event.registration_checked_at ? new Date(event.registration_checked_at).getTime() : NaN;
  if (event.registration_status !== 'open' || !event.registration_url || !event.source_url
      || !Number.isFinite(checked) || checked > now.getTime() || now.getTime()-checked > (event.id?.startsWith('ticketsports-') ? 2 : 7)*86400000) return 'needs_review';
  return 'open_checked';
}
