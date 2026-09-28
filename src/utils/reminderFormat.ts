/**
 * Display helpers for a survey's manual reminder counter
 * (Survey.reminder_count / last_reminder_at).
 */

/** Localized date + time of the last reminder, or null when never sent / unparsable. */
export const formatReminderDate = (iso: string | null | undefined, isRTL: boolean): string | null => {
  if (!iso) return null
  const date = new Date(iso)
  if (isNaN(date.getTime())) return null
  return date.toLocaleString(isRTL ? 'ar-SA' : 'en-US', {
    calendar: 'gregory',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Tooltip text, e.g. "Reminders sent: 3 · Last: Sep 28, 2026, 10:15 AM". */
export const reminderSummary = (
  count: number | undefined,
  lastAt: string | null | undefined,
  isRTL: boolean
): string => {
  const n = count ?? 0
  if (n === 0) return isRTL ? 'لم يتم إرسال أي تذكير بعد' : 'No reminders sent yet'
  const last = formatReminderDate(lastAt, isRTL)
  const base = isRTL ? `عدد التذكيرات المرسلة: ${n}` : `Reminders sent: ${n}`
  if (!last) return base
  return isRTL ? `${base} · آخر تذكير: ${last}` : `${base} · Last: ${last}`
}
